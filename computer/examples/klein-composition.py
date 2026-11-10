import sys
sys.path.insert(0, '/resources/klein')
from klein_autoling import Autoling, language_oracle
subjects = ['dog', 'cat', 'bird']
objects = ['fish', 'rice', 'seed']
learner = Autoling(language_oracle([['the', a, 'eats', b] for a in subjects for b in objects]))
for sentence in ['the dog eats fish', 'the cat eats fish', 'the dog eats rice', 'the cat eats rice', 'the bird eats seed', 'the bird eats rice']:
    learner.feed(sentence.split())
print('unseen_sentence=' + str(learner.parses('the bird eats fish'.split())))
print('invalid_order=' + str(learner.parses('fish the eats bird'.split())))
