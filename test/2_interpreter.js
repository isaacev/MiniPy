// [MiniPy] /test/2_interpreter.js

var expect = require('chai').expect;
var MiniPy = require('../build/' + require('../package.json').version);

var defaultInspectOptions = {
	hooks: {
		print: function() {},
		assign: function() {},
		exit: function() {},
	},
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
				expect(first).to.be.an('object').with.property('line').which.is.a('number');

				var second = inspector.next();

				expect(second).to.be.an('object').with.property('type').which.is.a('string');
				expect(second).to.be.an('object').with.property('line').which.is.a('number');
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

				var assignments = 0;
				var prints = 0;

				inspector.on('assign', function(variable, value) {
					expect(variable).to.be.a('string');
					expect(value).to.exist;

					assignments++;
				});

				inspector.on('print', function(output) {
					expect(output).to.be.a('string');

					prints++;
				});

				inspector.next(); // x = 1
				inspector.next(); // print("foo")
				inspector.next(); // x = 4
				inspector.next(); // null

				expect(assignments).to.equal(2);
				expect(prints).to.equal(1);
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
