package org.synthai.computer;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.ValueCallback;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.util.Base64;
import java.io.OutputStream;
import android.widget.FrameLayout;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.SecureRandom;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class MainActivity extends Activity {
    static { System.loadLibrary("computer-node"); System.loadLibrary("node"); }
    private static final String ORIGIN = "http://127.0.0.1:8765";
    private static boolean nodeStarted = false;
    private static String apiToken;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private FrameLayout root;
    private TextView status;
    private WebView browser;
    private ValueCallback<Uri[]> fileSelection;
    private byte[] pendingExport;
    private final String fileBridgeCapability = newSessionToken();
    public native int startNode(String[] args);

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        root = new FrameLayout(this);
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(0, bars.top, 0, bars.bottom);
            }
            return insets;
        });
        status = new TextView(this);
        status.setText("Starting Synthia's local computer…");
        status.setTextSize(18);
        status.setPadding(24, 40, 24, 24);
        root.addView(status);
        setContentView(root);
        synchronized (MainActivity.class) {
            if (apiToken == null) apiToken = newSessionToken();
            if (!nodeStarted) {
                nodeStarted = true;
                new Thread(this::startComputer, "synthia-computer-runtime").start();
            }
        }
        waitForComputer(0);
    }

    private static String newSessionToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        final char[] alphabet = "0123456789abcdef".toCharArray();
        char[] result = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int value = bytes[i] & 0xff;
            result[i * 2] = alphabet[value >>> 4];
            result[i * 2 + 1] = alphabet[value & 15];
        }
        return new String(result);
    }

    private void startComputer() {
        try {
            android.content.pm.PackageInfo packageInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
            File runtime = new File(getFilesDir(), "runtime-" + packageInfo.versionCode + "-" + packageInfo.lastUpdateTime);
            File entry = new File(runtime, "mobile-entry.mjs");
            File complete = new File(runtime, ".complete");
            if (!complete.isFile() || !entry.isFile()) {
                extractRuntime(runtime);
                if (!entry.isFile()) throw new IllegalStateException("Packaged computer entry is missing");
                if (!complete.createNewFile() && !complete.isFile()) throw new IllegalStateException("Cannot mark runtime ready");
            }
            File data = new File(getFilesDir(), "computer-data");
            if (!data.exists() && !data.mkdirs()) throw new IllegalStateException("Cannot create computer data directory");
            int exit = startNode(new String[]{"node", entry.getAbsolutePath(), data.getAbsolutePath(), apiToken});
            handler.post(() -> status.setText("Computer service exited: " + exit));
        } catch (Exception error) {
            handler.post(() -> status.setText("Computer startup failed: " + error));
        }
    }

    private void extractRuntime(File destination) throws Exception {
        if (!destination.exists() && !destination.mkdirs()) throw new IllegalStateException("Cannot create runtime directory");
        String base = destination.getCanonicalPath() + File.separator;
        try (InputStream source = getAssets().open("computer-assets.zip"); ZipInputStream zip = new ZipInputStream(source)) {
            ZipEntry item;
            while ((item = zip.getNextEntry()) != null) {
                File target = new File(destination, item.getName());
                if (!target.getCanonicalPath().startsWith(base)) throw new IllegalStateException("Invalid packaged path");
                if (item.isDirectory()) { if (!target.isDirectory() && !target.mkdirs()) throw new IllegalStateException("Cannot create runtime folder"); }
                else {
                    File parent = target.getParentFile();
                    if (!parent.isDirectory() && !parent.mkdirs()) throw new IllegalStateException("Cannot create runtime folder");
                    try (FileOutputStream output = new FileOutputStream(target)) {
                        byte[] buffer = new byte[16384]; int n;
                        while ((n = zip.read(buffer)) != -1) output.write(buffer, 0, n);
                    }
                }
                zip.closeEntry();
            }
        }
    }

    private void waitForComputer(int attempt) {
        if (isFinishing() || browser != null) return;
        new Thread(() -> {
            boolean ready = false;
            try {
                HttpURLConnection check = (HttpURLConnection) new URL(ORIGIN + "/api/status").openConnection();
                check.setConnectTimeout(700);
                check.setReadTimeout(700);
                check.setRequestProperty("Cookie", "synthia_session=" + apiToken);
                ready = check.getResponseCode() == 200;
                check.disconnect();
            } catch (Exception ignored) { }
            final boolean available = ready;
            handler.post(() -> {
                if (available) openDesktop();
                else if (attempt < 60) handler.postDelayed(() -> waitForComputer(attempt + 1), 500);
                else status.setText("The local computer did not start. Restart Synthia to retry.");
            });
        }, "computer-health-check").start();
    }

    private void openDesktop() {
        if (browser != null) return;
        root.removeView(status);
        browser = new WebView(this);
        browser.getSettings().setJavaScriptEnabled(true);
        browser.getSettings().setDomStorageEnabled(true);
        browser.getSettings().setAllowFileAccess(false);
        browser.getSettings().setAllowContentAccess(true);
        browser.addJavascriptInterface(new NativeFiles(), "__SynthiaNativeBridge");
        browser.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                if (!url.startsWith(ORIGIN + "/")) return;
                // addJavascriptInterface reaches every frame. Only the trusted top document
                // receives the unguessable capability in a closure; sandbox apps cannot call it.
                String cap = org.json.JSONObject.quote(fileBridgeCapability);
                view.evaluateJavascript("(()=>{const cap=" + cap + ";window.SynthiaNative={saveFile:(name,data)=>__SynthiaNativeBridge.saveFile(name,data,cap),restartForRestore:()=>__SynthiaNativeBridge.restartForRestore(cap)}})()", null);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                return !("http".equals(uri.getScheme()) && "127.0.0.1".equals(uri.getHost()) && uri.getPort() == 8765);
            }
        });
        browser.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileSelection != null) fileSelection.onReceiveValue(null);
                fileSelection = callback;
                Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("*/*");
                picker.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                startActivityForResult(picker, 81);
                return true;
            }
        });
        root.addView(browser, new FrameLayout.LayoutParams(-1, -1));
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        // The capability never appears in a URL or page JavaScript. Only this
        // app's WebView cookie jar receives it; normal same-origin fetch sends it.
        cookies.setCookie(ORIGIN, "synthia_session=" + apiToken + "; Path=/; HttpOnly; SameSite=Strict", accepted -> {
            if (Boolean.TRUE.equals(accepted)) {
                browser.loadUrl(ORIGIN + "/");
            } else {
                root.removeView(browser);
                browser.destroy();
                browser = null;
                root.addView(status);
                status.setText("Computer session could not be initialized.");
            }
        });
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == 82) {
            final byte[] bytes = pendingExport; pendingExport = null;
            if (result == RESULT_OK && data != null && data.getData() != null && bytes != null) {
                final Uri target = data.getData();
                new Thread(() -> {
                    try (OutputStream out = getContentResolver().openOutputStream(target)) {
                        if (out == null) throw new IllegalStateException("Could not open selected destination");
                        out.write(bytes);
                        handler.post(() -> android.widget.Toast.makeText(this, "File exported", android.widget.Toast.LENGTH_SHORT).show());
                    } catch (Exception error) { handler.post(() -> android.widget.Toast.makeText(this, "Export failed: " + error.getMessage(), android.widget.Toast.LENGTH_LONG).show()); }
                }, "synthia-export").start();
            }
            return;
        }
        if (request != 81 || fileSelection == null) return;
        Uri[] selected = null;
        if (result == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                selected = new Uri[data.getClipData().getItemCount()];
                for (int i = 0; i < selected.length; i++) selected[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) selected = new Uri[]{data.getData()};
        }
        fileSelection.onReceiveValue(selected);
        fileSelection = null;
    }

    @Override public void onBackPressed() {
        if (browser == null) { super.onBackPressed(); return; }
        browser.evaluateJavascript("(()=>{const event=new CustomEvent('synthia-back',{cancelable:true});return !window.dispatchEvent(event)})()", handled -> {
            if (!"true".equals(handled)) MainActivity.super.onBackPressed();
        });
    }

    private final class NativeFiles {
        @JavascriptInterface public void saveFile(String name, String base64, String capability) {
            if (!fileBridgeCapability.equals(capability)) return;
            if (base64 == null || base64.length() > 28000000) return;
            final byte[] bytes;
            try { bytes = Base64.decode(base64, Base64.DEFAULT); } catch (IllegalArgumentException error) { return; }
            handler.post(() -> {
                if (pendingExport != null) { android.widget.Toast.makeText(MainActivity.this, "Finish the current export first", android.widget.Toast.LENGTH_SHORT).show(); return; }
                pendingExport = bytes;
                Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                save.addCategory(Intent.CATEGORY_OPENABLE); save.setType("application/octet-stream");
                save.putExtra(Intent.EXTRA_TITLE, name == null ? "synthia-export" : name.replaceAll("[\\\\/]", "_"));
                startActivityForResult(save, 82);
            });
        }
        @JavascriptInterface public void restartForRestore(String capability) {
            if (!fileBridgeCapability.equals(capability)) return;
            handler.post(() -> {
                new android.app.AlertDialog.Builder(MainActivity.this).setTitle("Restore Synthia checkpoint?")
                    .setMessage("Synthia will close. Open the app again to apply the staged backup. Your previous state will be preserved.")
                    .setNegativeButton("Cancel", null)
                    .setPositiveButton("Close for restore", (dialog, which) -> { finishAffinity(); android.os.Process.killProcess(android.os.Process.myPid()); }).show();
            });
        }
    }
}
