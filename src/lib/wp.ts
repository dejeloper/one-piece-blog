const domain = import.meta.env.WP_DOMAIN
const username = import.meta.env.WP_USERNAME
const password = import.meta.env.WP_PASSWORD
const apiURL = `${domain}/wp-json/wp/v2`
const jwtURL = `${domain}/wp-json/jwt-auth/v1/token`;

// Cache para el token JWT
let tokenCache: {token: string; expiry: number} | null = null;

interface CacheEntry<T> {
	data: T;
	expiry: number;
}

const responseCache = new Map<string, CacheEntry<any>>();

const CACHE_DURATIONS = {
	posts: 5,
	chapters: 10,
	categories: 30,
	pages: 15,
	documents: 10
} as const;

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

	const {title: {rendered: title}, date, content: {rendered: content}, excerpt: {rendered: excerptRaw}} = data;
	const excerpt = excerptRaw.replace(/<[^>]*>/g, '').trim();
	const featuredImage = data._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
	const alt_text_image = data._embedded?.['wp:featuredmedia']?.[0]?.alt_text || '';
	const authorName = data._embedded?.author?.[0]?.name || 'Unknown Author';
	const authorAvatar = data._embedded?.author?.[0]?.avatar_urls?.['96'] || '';
	const authorDescription = data._embedded?.author?.[0]?.description || '';

	const navigation = await getChapterNavigation(slug);

	return {
		title,
		date,
		content,
		excerpt,
		featuredImage,
		alt_text_image,
		authorName,
		authorAvatar,
		authorDescription,
		...navigation
	};
}

export const getChapterNavigation = async (currentSlug: string) => {
	try {
		const chapters = await getAllChaptersOrdered('historia', false);

		if (!chapters || chapters.length === 0) {
			return {
				isFirst: true,
				isLast: true,
				prevSlug: null,
				nextSlug: null,
				prevTitle: null,
				nextTitle: null
			};
		}

		const currentIndex = chapters.findIndex(chapter => chapter.slug === currentSlug);

		if (currentIndex === -1) {
			return {
				isFirst: true,
				isLast: true,
				prevSlug: null,
				nextSlug: null,
				prevTitle: null,
				nextTitle: null
			};
		}

		const isFirst = currentIndex === 0;
		const isLast = currentIndex === chapters.length - 1;
		const prevChapter = !isFirst ? chapters[currentIndex - 1] : null;
		const nextChapter = !isLast ? chapters[currentIndex + 1] : null;

		return {
			isFirst,
			isLast,
			prevSlug: prevChapter?.slug || null,
			nextSlug: nextChapter?.slug || null,
			prevTitle: prevChapter?.title || null,
			nextTitle: nextChapter?.title || null
		};
	} catch (error) {
		console.warn('Error getting chapter navigation:', error);
		return {
			isFirst: true,
			isLast: true,
			prevSlug: null,
			nextSlug: null,
			prevTitle: null,
			nextTitle: null
		};
	}
}

export const getIdCategoryByName = async (name: string) => {
	try {
		const cacheKey = `category_${name}`;
		const data = await fetchWithCache<any[]>(
			`${apiURL}/categories?search=${name}`,
			cacheKey,
			'categories'
		);

		if (!data || data.length === 0) return null;
		return data[0].id;
	} catch (error) {
		console.warn(`Error fetching category "${name}":`, error);
		return null;
	}
};

const extractChapterNumber = (slug: string): number => {
	const match = slug.match(/cap(?:itulo)?-(\d+)/i);
	return match ? parseInt(match[1], 10) : 0;
};

export const getLatestPosts = async ({category, perPage = 10, requireAuth = false}: {category: string, perPage?: number, requireAuth?: boolean}) => {
	const categoryId = await getIdCategoryByName(category);

	if (!categoryId) throw new Error('Invalid category');

	const cacheKey = `posts_${category}_${perPage}_${requireAuth}`;
	const resultados = await fetchWithCache<any[]>(
		`${apiURL}/posts?per_page=${perPage}&categories=${categoryId}&_embed`,
		cacheKey,
		'posts',
		requireAuth
	);

	if (!resultados || resultados.length === 0)
		throw new Error('No posts found');

	const posts: Chapter[] = resultados.map((post: any) => {
		const {
			id,
			title: {rendered: title},
			excerpt: {rendered: excerptRaw},
			content: {rendered: content},
			date,
			slug,
		} = post;

		const excerpt = excerptRaw.replace(/<[^>]*>/g, '').trim();

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

export const getAllChaptersOrdered = async (category: string, requireAuth: boolean = false) => {
	const categoryId = await getIdCategoryByName(category);

	if (!categoryId) throw new Error('Invalid category');

	const cacheKey = `chapters_${category}_${requireAuth}`;
	const resultados = await fetchWithCache<any[]>(
		`${apiURL}/posts?per_page=100&categories=${categoryId}&_embed`,
		cacheKey,
		'chapters',
		requireAuth
	);

	if (!resultados || resultados.length === 0)
		throw new Error('No chapters found');

	const chapters: Chapter[] = resultados.map((post: any) => {
		const {
			id,
			title: {rendered: title},
			excerpt: {rendered: excerptRaw},
			content: {rendered: content},
			date,
			slug,
		} = post;

		const excerpt = excerptRaw.replace(/<[^>]*>/g, '').trim();

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

export const getDocuments = async ({perPage = 10, requireAuth = false}: {perPage?: number, requireAuth?: boolean} = {}) => {
	try {
		const categoryId = await getIdCategoryByName('Documentos');

		if (!categoryId) return [];

		const cacheKey = `documents_${perPage}_${requireAuth}`;
		const resultados = await fetchWithCache<any[]>(
			`${apiURL}/posts?per_page=${perPage}&categories=${categoryId}&_embed`,
			cacheKey,
			'documents',
			requireAuth
		);

		if (!resultados || resultados.length === 0) return [];

		const documents = resultados.map((post: any) => {
			const {
				id,
				title: {rendered: title},
				excerpt: {rendered: excerptRaw},
				content: {rendered: content},
				date,
				slug,
			} = post;

			const excerpt = excerptRaw.replace(/<[^>]*>/g, '').trim();

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

		return documents;
	} catch (error) {
		// En caso de cualquier error, devolver array vacío para no romper la aplicación
		console.warn('Error fetching documents:', error);
		return [];
	}
};

const getToken = async (): Promise<string> => {
	// Verificar si el token en caché sigue siendo válido
	if (tokenCache && Date.now() < tokenCache.expiry) {
		return tokenCache.token;
	}

	const res = await fetch(jwtURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({username, password}),
	});

	if (!res.ok) throw new Error('Failed to get JWT token');

	const data = await res.json();

	// Cachear el token por 50 minutos (los tokens JWT suelen durar 1 hora)
	tokenCache = {
		token: data.token,
		expiry: Date.now() + (50 * 60 * 1000)
	};

	return data.token;
};

// Función auxiliar para hacer fetch con token solo si es necesario
const fetchWithOptionalAuth = async (url: string, requireAuth: boolean = false) => {
	const headers: Record<string, string> = {};

	if (requireAuth) {
		const token = await getToken();
		headers.Authorization = `Bearer ${token}`;
	}

	return fetch(url, {headers});
};

const fetchWithCache = async <T>(
	url: string,
	cacheKey: string,
	cacheType: keyof typeof CACHE_DURATIONS,
	requireAuth: boolean = false
): Promise<T> => {
	const cached = responseCache.get(cacheKey);
	if (cached && Date.now() < cached.expiry) {
		return cached.data;
	}

	const res = await fetchWithOptionalAuth(url, requireAuth);
	if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);

	const data = await res.json();

	const cacheDuration = CACHE_DURATIONS[cacheType] * 60 * 1000;
	responseCache.set(cacheKey, {
		data,
		expiry: Date.now() + cacheDuration
	});

	return data;
};

export const clearCache = (pattern?: string) => {
	if (!pattern) {
		responseCache.clear();
		return;
	}

	for (const [key] of responseCache) {
		if (key.includes(pattern)) {
			responseCache.delete(key);
		}
	}
}; 