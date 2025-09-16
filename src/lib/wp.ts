const domain = import.meta.env.WP_DOMAIN
const username = import.meta.env.WP_USERNAME
const password = import.meta.env.WP_PASSWORD
const apiURL = `${domain}/wp-json/wp/v2`
const jwtURL = `${domain}/wp-json/jwt-auth/v1/token`;

interface PostsCards {
	id: number;
	title: {rendered: string};
	excerpt: {rendered: string};
	content: {rendered: string};
	date: string;
	slug: string;
	_embedded?: {
		'wp:featuredmedia'?: {source_url: string}[];
	};
}

export const getAllPostsSlugs = async () => {
	const res = await fetch(`${apiURL}/posts?per_page=100`)

	if (!res.ok)
		throw new Error('Failed to fetch posts slugs')

	const data = await res.json()
	if (!data || data.length === 0)
		throw new Error('No posts found')

	const slugs = data.map((post: {slug: string}) => post.slug)
	return slugs

}

export const getPageInfo = async (slug: string) => {
	const res = await fetch(`${apiURL}/pages?slug=${slug}`);

	if (!res.ok)
		throw new Error('Failed to fetch page info')

	const [data] = await res.json()
	if (!data) throw new Error('Page not found')

	const {title: {rendered: title}, content: {rendered: content}, yoast_head_json: seo} = data

	return {title, content, seo};
}

export const getPostsInfo = async (slug: string) => {
	const res = await fetch(`${apiURL}/posts?slug=${slug}`);

	if (!res.ok)
		throw new Error('Failed to fetch post info')

	const [data] = await res.json()
	if (!data) throw new Error('Post not found');

	const {title: {rendered: title}, content: {rendered: content}, yoast_head_json: seo} = data

	return {title, content, seo};
}

export const getLatestPosts = async ({perPage = 10}: {perPage?: number}) => {
	const token = await getToken();

	const res = await fetch(`${apiURL}/posts?per_page=${perPage}&_embed`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok) throw new Error('Failed to fetch latest posts');

	const resultados = await res.json();

	if (!resultados || resultados.length === 0)
		throw new Error('No posts found');

	const posts = resultados.map((post: PostsCards) => {
		const {
			id,
			title: {rendered: title},
			excerpt: {rendered: excerpt},
			content: {rendered: content},
			date,
			slug,
		} = post;

		const featuredImage =
			post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';

		return {
			id,
			title,
			excerpt,
			content,
			date,
			slug,
			featuredImage,
		};
	});

	return posts;
};

const getToken = async (): Promise<string> => {
	const res = await fetch(jwtURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({username, password}),
	});

	if (!res.ok) throw new Error('Failed to get JWT token');

	const data = await res.json();
	return data.token;
}; 