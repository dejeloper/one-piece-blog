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

interface Chapter {
	id: number;
	title: string;
	excerpt: string;
	content: string;
	date: string;
	slug: string;
	featuredImage: string;
	chapterNumber: number;
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

	const {title: {rendered: title}, content: {rendered: content}} = data

	return {title, content};
}

export const getPostsInfo = async (slug: string) => {
	const res = await fetch(`${apiURL}/posts?slug=${slug}&_embed`);

	if (!res.ok)
		throw new Error('Failed to fetch post info')

	const [data] = await res.json()
	if (!data) throw new Error('Post not found');

	const {title: {rendered: title}, date, content: {rendered: content}, excerpt: {rendered: excerpt}} = data
	const featuredImage = data._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
	const alt_text_image = data._embedded?.['wp:featuredmedia']?.[0]?.alt_text || '';
	const authorName = data._embedded?.author?.[0]?.name || 'Unknown Author';
	const authorAvatar = data._embedded?.author?.[0]?.avatar_urls?.['96'] || '';
	const authorDescription = data._embedded?.author?.[0]?.description || '';

	return {title, date, content, excerpt, featuredImage, alt_text_image, authorName, authorAvatar, authorDescription};
}

export const getIdCategoryByName = async (name: string) => {
	const res = await fetch(`${apiURL}/categories?search=${name}`);

	if (!res.ok)
		throw new Error('Failed to fetch category ID');

	const [data] = await res.json();
	if (!data) throw new Error('Category not found');

	return data.id;
};

const extractChapterNumber = (slug: string): number => {
	const match = slug.match(/cap(?:itulo)?-(\d+)/i);
	return match ? parseInt(match[1], 10) : 0;
};

export const getLatestPosts = async ({category, perPage = 10}: {category: string, perPage?: number}) => {
	const token = await getToken();

	const categoryId = await getIdCategoryByName(category);

	if (!categoryId) throw new Error('Invalid category');

	const res = await fetch(`${apiURL}/posts?per_page=${perPage}&categories=${categoryId}&_embed`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok) throw new Error('Failed to fetch latest posts');

	const resultados = await res.json();

	if (!resultados || resultados.length === 0)
		throw new Error('No posts found');

	const posts: Chapter[] = resultados.map((post: any) => {
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

		const chapterNumber = extractChapterNumber(slug);

		return {
			id,
			title,
			excerpt,
			content,
			date,
			slug,
			featuredImage,
			chapterNumber,
		};
	});

	posts.sort((a: Chapter, b: Chapter) => a.chapterNumber - b.chapterNumber);

	return posts;
};

export const getAllChaptersOrdered = async (category: string) => {
	const token = await getToken();

	const categoryId = await getIdCategoryByName(category);

	if (!categoryId) throw new Error('Invalid category');

	const res = await fetch(`${apiURL}/posts?per_page=100&categories=${categoryId}&_embed`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok) throw new Error('Failed to fetch chapters');

	const resultados = await res.json();

	if (!resultados || resultados.length === 0)
		throw new Error('No chapters found');

	const chapters: Chapter[] = resultados.map((post: any) => {
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

		const chapterNumber = extractChapterNumber(slug);

		return {
			id,
			title,
			excerpt,
			content,
			date,
			slug,
			featuredImage,
			chapterNumber,
		};
	});

	chapters.sort((a: Chapter, b: Chapter) => a.chapterNumber - b.chapterNumber);

	return chapters;
};

export const getCuriosities = async () => {
	const Curiosities = [
		{
			icon: "✨",
			title: "La ciencia de la intuición",
			description:
				"La neurociencia revela que nuestros “presentimientos” procesan información más rápido que el pensamiento consciente.",
		},
		{
			icon: "📜",
			title: "Sabiduría antigua, validación moderna",
			description:
				"Prácticas milenarias como la meditación y la respiración hoy son confirmadas por la psicología moderna.",
		},
		{
			icon: "☕",
			title: "El poder del ritual",
			description:
				"Pequeños rituales diarios pueden reprogramar nuestro cerebro para mayor resiliencia y bienestar.",
		},
		{
			icon: "📖",
			title: "Las historias moldean la realidad",
			description:
				"Los relatos que nos contamos literalmente reconfiguran nuestro cerebro y transforman nuestra vida.",
		},
	]

	return []; // Curiosities;
};

export const getReviews = async ({perPage = 3}) => {
	const reviews = [
		{
			name: "Sarah Mitchell",
			role: "Life Coach",
			text: "Este libro transformó por completo mi visión del crecimiento personal. Los ejercicios prácticos cambiaron mi vida.",
			rating: 4.5,
		},
		{
			name: "David Chen",
			role: "Terapeuta",
			text: "Una mezcla magistral de sabiduría antigua y psicología moderna. Lo recomiendo a todos mis pacientes.",
			rating: 5,
		},
		{
			name: "Maria Rodriguez",
			role: "Wellness Practitioner",
			text: "El Viaje Interior ofrece profundas ideas con claridad y compasión. Verdaderamente excepcional.",
			rating: 3.5,
		},
	]

	return [];// reviews.slice(0, perPage);

}

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