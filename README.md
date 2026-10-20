# Prompt Engineering Workshop

Practise prompt engineering by recreating a frontend from a picture of it:

1. Pick a **target**: a built-in test or your own file. You see it rendered; tick **Show code** if you want to read its source (for example, to compare after scoring).
2. Prompt an AI to build it, as plain **HTML** or as a **React + Tailwind + TypeScript** component (see Tracks below).
3. Paste the code into **Yours**. A live preview shows what it renders.
4. Click **Score** to get a 0–100 visual similarity score and a heatmap of where the two differ.
   Try to get a high score in as few prompts as you can.

## Run

```bash
npm install
npx playwright install chromium
npm start        # http://localhost:3000
npm test
```

## Tracks and targets

Pick a **track** at the top of the page:

- **HTML**: rebuild the target as plain HTML/CSS. Yours starts in HTML mode.
- **React**: rebuild the target as a React + Tailwind + TypeScript component. Yours starts in React TSX mode.

Each track has its own tests, laid out as `public/targets/<track>/<category>/<test>`:

| | `components/` (UI pieces to build) | `styling/` (visual style to match) |
| --- | --- | --- |
| `html/` | navbar, pricing cards, login form | gradient hero, shadows and radii, palette and buttons |
| `react/` | project card grid, tabs with an activity feed, a modal dialog | dark dashboard, a typography scale, a glass card on a gradient |

To add a test, put an `.html`, `.tsx`, PNG, JPEG, WebP or GIF file (5MB at most) in a category folder.
A new folder adds a new category, or a new track if it sits directly under `targets/`. Tests are
listed in natural order (`test-2` before `test-10`), and the file name becomes the label (`test-4.html`
shows as "Test 4"). A `.tsx` target follows the same rules as a React answer below.

To practise with something that isn't a built-in test, choose **Upload your own…** and pick or drop an
`.html`, `.tsx` or image file. Uploads last only until you reload the page.

## Writing "Yours"

Yours has three modes. Each code mode keeps its own draft, so switching between them loses nothing.

- **HTML**: paste a full page or a fragment. The preview updates as you type.
- **React TSX**: paste a single module whose **default export** is the component:

  ```tsx
  export default function App() {
    return <h1 className="text-4xl font-bold p-10">Hello</h1>;
  }
  ```

  Style it with Tailwind classes (v4; no config needed). Only `react` and `react-dom` can be imported.
  TypeScript types are allowed, but they are stripped, not type-checked.
- **Image**: score a screenshot instead.

## Scoring

Both pages are rendered at 1280px wide (full page, at most 4000px tall). The score blends
SSIM (layout/structure) with CIEDE2000 colour distance, then is normalised so that an
empty page scores ~0 and an identical page scores 100.

Pasted HTML and TSX run in headless Chromium with network access, so run this locally only.
