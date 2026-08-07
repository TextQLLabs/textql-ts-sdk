/** The browser half. Client code Vite serves and bundles — it only knows the routes
 * `textqlEmbed.js` mounts, never the key behind them. */
import '@textql/sdk/embed/element';

const API_BASE = '/api/textql';

const main = document.querySelector('#main');
const title = document.querySelector('#title');
const back = document.querySelector('#back');

// Resolved once and reused, so going back to the list does not re-fetch.
let apps = null;
async function load() {
	if (apps) return apps;
	const response = await fetch(API_BASE);
	const body = await response.json();
	if (!response.ok) throw new Error(body.error ?? `The list returned ${response.status}.`);
	apps = body;
	return apps;
}

function card(app) {
	const button = document.createElement('button');
	button.className = 'card';
	button.innerHTML = app.screenshotUrl
		? `<img src="${encodeURI(app.screenshotUrl)}" alt="">`
		: '<div class="blank"></div>';
	// textContent, not innerHTML: the name is the app's, not ours.
	const name = document.createElement('p');
	name.textContent = app.name;
	button.append(name);
	button.addEventListener('click', () => (location.hash = app.id));
	return button;
}

function note(text) {
	const element = document.createElement('p');
	element.className = 'empty';
	element.textContent = text;
	return element;
}

async function list() {
	title.textContent = 'Data apps';
	back.hidden = true;
	main.replaceChildren(note('Loading…'));

	try {
		const found = await load();
		if (!found.length) return main.replaceChildren(note('No apps to show.'));
		const grid = document.createElement('div');
		grid.className = 'grid';
		grid.append(...found.map(card));
		main.replaceChildren(grid);
	} catch (cause) {
		main.replaceChildren(note(cause.message));
	}
}

function app(id) {
	// Fresh element, so api-base is set before insertion and the first load is right.
	const element = document.createElement('textql-app');
	element.setAttribute('api-base', `${API_BASE}/${encodeURIComponent(id)}`);
	element.addEventListener('app-meta', ({ detail }) => (title.textContent = detail.name));

	title.textContent = 'Loading…';
	back.hidden = false;
	main.replaceChildren(element);
}

// Checked against the list, so a hand-typed id shows the grid, not a 404.
async function route() {
	const id = location.hash.slice(1);
	if (!id) return list();
	const found = await load().catch(() => []);
	found.some((entry) => entry.id === id) ? app(id) : list();
}

addEventListener('hashchange', route);
route();
