'use strict';

const chai = require('chai');
chai.use(require('chai-as-promised'));

const Tools = require('../lib/tools');

const expect = chai.expect;
chai.should();

// Shut up console logging
console.warn = function() {};

const batchActions = ['unlink', 'rmdir', 'mkdir', 'rename', 'writeFile'];

function FakeConnector() {
	this.calls = Object.create(null);
	for(const action of batchActions) {
		this.calls[action] = 0;
		FakeConnector.prototype[action] = function() { this.calls[action]++;};
	}
}

describe('Tools', function() {

	const defaultValues = {
		name: 'Default name',
		displayName: 'Default dislay name',
		icon: '../default-icon.png',
		description: 'Default description'
	};

	describe('mergeInfos', function() {

		it('returns default values when invalid overrides are given', function() {
			Tools.mergeInfos('new values', defaultValues).should.deep.equal(defaultValues);
		});

		it('returns default values when no override is present', function() {
			Tools.mergeInfos(null, defaultValues).should.deep.equal(defaultValues);
			Tools.mergeInfos({}, defaultValues).should.deep.equal(defaultValues);
		});

		it('overrided value when given', function() {
			const overrides = {
				name: 'Overriden name',
				displayName: 'Overriden dislay name',
				icon: '../overriden-icon.png',
				description: 'Overriden description'
			};
			for(const key in overrides) {
				const newInfos = Object.create(null);
				newInfos[key] = overrides[key];
				Tools.mergeInfos(newInfos, defaultValues).should.deep.equal(Object.assign(defaultValues, newInfos));
			}
		});
	});

	describe('simpleBatch', function() {
		it('does noting if the action is invalid', function() {
			const connector = new FakeConnector();
			return Tools.simpleBatch(connector, {}, [{name: 'unsupported'}])
			.then(() => {
				Object.keys(connector.calls).every((key) => connector.calls[key] === 0).should.be.true;
			});
		});

		it('calls the designated actions', function() {
			const connector = new FakeConnector();
			const actions = [{name: 'unlink'}, {name: 'writeFile'}, {name: 'rename'}];
			return Tools.simpleBatch(connector, {}, actions)
			.then(() => {
				batchActions
				.filter((action) => !actions.map((a) => a.name).includes(action))
				.every((key) => connector.calls[key] === 0).should.be.true;
				actions.every((act) => connector.calls[act.name] === 1).should.be.true;
			});
		});
	});

	describe('clearSession', function() {
		it('empties a session object', function() {
			const session = {
				token: 'aaa',
				user: 'tmu'
			};
			Tools.clearSession(session);
			session.should.deep.equal({});
		});
	});

	describe('parseBasicAuth', function() {
		const validAuth = {
			host: 'www.silexlabs.org',
			port: null,
			protocol: 'http:',
			password: 'pwd',
			user: 'user'
		};

		it('throws an error if auth is malformed', function() {
			const auth = 'http://www.silexlabs.org';
			expect(() => Tools.parseBasicAuth(auth)).to.throw('Invalid URL');
		});

		it('parse auth as a String', function() {
			const auth = 'http://user:pwd@www.silexlabs.org';
			Tools.parseBasicAuth(auth).should.deep.equal(validAuth);
		});

		it('parse auth as an Object', function() {
			Tools.parseBasicAuth(validAuth).should.deep.equal(validAuth);
		});
	});
});
