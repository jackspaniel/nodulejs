test:	
	@./node_modules/.bin/mocha --bail --check-leaks\
		--require test/env\
		--reporter spec\
		test/nodule.test.js

test-cov:
	@NODE_ENV=test node \
		node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha \
		-- -u exports \
		test/nodule.test.js \
		--bail

test-travis:
	@NODE_ENV=test node \
		node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha \
		--report lcovonly \
		-- -u exports \
		test/nodule.test.js \
		--bail

.PHONY: test 