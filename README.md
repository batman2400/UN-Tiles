This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Real Data Feed

The app now reads catalog data from `src/data/catalog.json` and supports a remote API source.

To use your own live data endpoint, add an environment variable:

```bash
UN_TILES_API_URL=https://your-api.example.com/catalog
```

Expected response shape:

```json
{
	"categories": [
		{ "slug": "floor-tiles", "name": "Floor Tiles", "image": "/images/landing_hero.png" }
	],
	"products": [
		{
			"id": "p1",
			"sku": "FLT-CAL-6060",
			"name": "Calacatta Prime",
			"dimensions": "60x60cm",
			"pricePerSqFt": 13.25,
			"image": "/images/landing_hero.png",
			"categorySlug": "floor-tiles",
			"featured": true,
			"finish": "Polished",
			"application": "Interior",
			"stockSqFt": 1840
		}
	]
}
```

If the remote endpoint is unavailable or invalid, the app safely falls back to the local catalog seed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
