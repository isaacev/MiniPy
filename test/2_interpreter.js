// [MiniPy] /test/2_interpreter.js

var expect = require('chai').expect;
var MiniPy = require('../build/' + require('../package.json').version);

var defaultInspectOptions = {
	hooks: {
		print: function() {},
		scope: function() {},
		exit: function() {},
	},
	globals: {
		print: function () {},
	}
};

describe('interpreter', function() {
	describe('#inspect()', function() {
		it('should return an inspector object', function() {
			var inspector = MiniPy.inspect('x = 1');

			expect(inspector).to.have.property('next').and.to.be.a('function');
			expect(inspector).to.have.property('on').and.to.be.a('function');
		});

		describe('#next()', function() {
			it('should return expression details after each call', function() {
				var inspector = MiniPy.inspect('x = 1\na = "foo"', defaultInspectOptions);

				var first = inspector.next();

				expect(first).to.be.an('object').with.property('type').which.is.a('string');
				expect(first).to.be.an('object').with.property('range').which.is.a('object');

				var second = inspector.next();

				expect(second).to.be.an('object').with.property('type').which.is.a('string');
				expect(second).to.be.an('object').with.property('range').which.is.an('object');
			});

			it('should return null after exhausting expressions', function() {
				var inspector = MiniPy.inspect('x = 1\na = "foo"', defaultInspectOptions);

				inspector.next();
				inspector.next();

				var third = inspector.next();

				expect(third).to.equal(null);
			});
		});

		describe('#on()', function() {
			it('should attach hook for execution events', function() {
				var inspector = MiniPy.inspect('x = 1\nprint("foo")\nx = 4', defaultInspectOptions);

				var scopeChanges = 0;
				var exit = false;

				inspector.on('scope', function(scopeJSON) {
					expect(scopeJSON).to.be.an('object');

					scopeChanges++;
				});

				inspector.on('exit', function() {
					exit = true;
				});

				inspector.next(); // x = 1
				inspector.next(); // print("foo")
				inspector.next(); // x = 4
				inspector.next(); // null

				expect(scopeChanges).to.equal(2);
				expect(exit).to.be.true;
			});

			it('should attach hook to exit event', function() {
				var inspector = MiniPy.inspect('x = 1\nprint("foo")\nx = 4', defaultInspectOptions);

				var exitCalls = 0;

				inspector.on('exit', function(payload) {
					exitCalls++;
				});

				inspector.next(); // x = 1
				inspector.next(); // print("foo")
				inspector.next(); // x = 4
				inspector.next(); // null
				inspector.next(); // null
				inspector.next(); // null

				expect(exitCalls).to.equal(1);
			});
		});
	});
});
