const resolveRequest = (req, opt) => {
	return req instanceof IDBRequest
		? new Promise((resolve, reject) => {
			req.onerror = (event) => {
				console.log(event.target.error);

				if (opt && opt.onerror)
					opt.onerror(req.error);

				reject(req.error);
			};
			req.onsuccess = (event) => {
//				console.log(event.target.result);

				if (opt && opt.onsuccess)
					opt.onsuccess(req.result);

				resolve(req.result);
			};
			if (opt && typeof (opt) == 'object')
				Object.keys(Object.getPrototypeOf(req))
					.filter(key => typeof (opt[key]) == 'function')
					.forEach(key => req[key] = (event) => opt[key](event.target.readyState == 'done' ? event.target.result : undefined));
		})
		: Promise.resolve();
};

const end = function () {
	let tx = this instanceof IDBTransaction;
	return resolveRequest(tx ? this.commit() : this.close());
};
const get = function (name, key) {
	let tx = this instanceof IDBTransaction ? this : this.transaction(name);
	let store = tx.objectStore(name);
	return resolveRequest(key ? store.get(key) : store.getAll());
};
const chain = function (name, mode, func, ...objects) {
	let tx = this instanceof IDBTransaction ? this : this.transaction(name, mode);
	let store = tx.objectStore(name);
	return objects.reduce((prev, curr) => prev.then(() => resolveRequest(func(curr, store, tx))), Promise.resolve());
};
const add = function (name, ...objects) {
	return chain.call(this, name, 'readwrite', (o, s) => s.add(o), ...objects);
};
const put = function (name, ...objects) {
	return chain.call(this, name, 'readwrite', (o, s) => s.put(o), ...objects);
};
const del = function (name, ...objects) {
	return chain.call(this, name, 'readwrite', (o, s) => s.delete(typeof (o) == 'object' ? o[s.keyPath] : o), ...objects);
};
const begin = function (mode, ...storeNames) {
	let tx = this.transaction(storeNames, mode);
	tx.get = get.bind(tx);
	tx.add = add.bind(tx);
	tx.put = put.bind(tx);
	tx.delete = del.bind(tx);
	tx.end = end.bind(tx);
	// tx.commit = (func) => {
	// 	if (func)
	// 		func(tx);

	// 	return resolveRequest(tx.commit());
	// }
	return tx;
};

export default (name, version, onupgradeneeded, onblocked) => {
	return resolveRequest(window.indexedDB.open(name, version), {
		onsuccess: (db) => {
			db.end = end.bind(db);
			db.get = get.bind(db);
			db.add = add.bind(db);
			db.put = put.bind(db);
			db.delete = del.bind(db);
			db.begin = begin.bind(db);
		},
		onupgradeneeded: typeof (onupgradeneeded) == 'function' ? onupgradeneeded : (db) => {
			Object.keys(onupgradeneeded)
				.filter(name => !db.objectStoreNames.contains(name))
				.forEach(name => {
					let options = onupgradeneeded[name];

					db.createObjectStore(name, typeof (options) == 'string' ? { keyPath: options } : options);
				});
		},
		onblocked
	});
};
