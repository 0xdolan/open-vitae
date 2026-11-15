# Photos and icons

Previous: [Pages and printing](11-pages-and-printing.md) · Next: [Import and export](13-import-and-export.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Adding a photo](#adding-a-photo)
- [Cropping](#cropping)
- [Size guide](#size-guide)
- [Shape, width and position](#shape-width-and-position)
- [How photos are stored](#how-photos-are-stored)
- [Icons](#icons)
- [Icon sets and licences](#icon-sets-and-licences)
- [How icons are loaded](#how-icons-are-loaded)
- [Code map](#code-map)

## Adding a photo

Open **Profile** and choose **Add a photo**, or drag a picture onto the box. JPEG, PNG and WebP work, and so does any other format your browser can open (for example HEIC in Safari). Files up to 25 MB are accepted.

The picture is read in the browser and never uploaded. It is shrunk to at most 2400 pixels on its longer side and re-encoded, which also removes hidden metadata such as the GPS location of the camera.

A photo is not expected in every country, and many employers prefer resumes without one. Leave it out if you are unsure.

## Cropping

After choosing a picture, the crop window opens:

- **Drag** the picture to move it under the frame.
- **Zoom** with the slider, the mouse wheel or the **+** and **−** keys.
- **Keyboard:** focus the picture and use the arrow keys to move it (hold **Shift** for bigger steps).
- **Turn** left or right a quarter at a time.
- **Shape of the crop:** Square, Portrait 4:5, Passport 35 × 45 mm, or the picture's original shape.

The frame shows the shape the photo will have on the page (square, rounded or circle). **Use this photo** saves it.

**Crop** in the photo panel opens the window again with the previous crop, working from the original picture, so you can re-crop as often as you like without losing quality. Photos from older or imported resumes, which have no original kept, are cropped from the photo itself.

## Size guide

Both the crop window and the photo panel show how sharp the photo will print at its width on the page:

| Label         | Print resolution | Meaning                                      |
| ------------- | ---------------- | -------------------------------------------- |
| Sharp         | 250 DPI and up   | Looks crisp on paper                         |
| Acceptable    | 150 to 249 DPI   | Fine on screen, slightly soft on paper       |
| May look soft | Below 150 DPI    | Use a larger picture or a smaller width      |

For example, a photo 30 mm wide needs at least 355 pixels across to print at 300 DPI. Pictures of at least 600 × 600 pixels are recommended.

## Shape, width and position

- **Shape:** square, rounded corners or circle.
- **Width:** 10 to 80 mm. The height follows the crop.
- **Position:** beside the name at the start of the line, beside the name at the end of the line, or centred above the name. In a right-to-left resume, start is the right side.

## How photos are stored

The resume keeps two images, both as data in the browser: the finished photo (at most 1000 pixels on its longer side) and the original picture with the crop applied to it. Version history stores each distinct image only once, however many versions use it, so saving every change does not multiply the space a photo takes.

## Icons

Icons can be added to:

- **Sections:** the **Icon** button next to the section title.
- **Entries:** the **Icon** button next to the entry title.
- **Links:** the **Icon** button on each profile link, for example a GitHub logo.
- **The contact line:** tick **Page setup → Icons in the contact line** to show icons before the email, phone, location, website and links.

The icon window searches by name in the chosen set. Typing everyday words works too: "email" finds mail icons, "location" finds map pins, "website" finds globes and "job" finds briefcases. Icons take the size and colour of the text next to them, and are hidden from screen readers because the text already says what they mean.

## Icon sets and licences

All sets come from the [react-icons](https://react-icons.github.io/react-icons/) package (MIT). Lucide is its `lu` set. The licence of each set is that of the original project and is shown in the icon window with a link.

| Set                    | Licence      | Set                    | Licence      |
| ---------------------- | ------------ | ---------------------- | ------------ |
| Lucide                 | ISC          | GitHub Octicons        | MIT          |
| Font Awesome 6 and 5   | CC BY 4.0    | Grommet Icons          | Apache 2.0   |
| Simple Icons (brands)  | CC0 1.0      | Heroicons 1 and 2      | MIT          |
| Tabler Icons           | MIT          | IcoMoon Free           | CC BY 4.0    |
| Material Design        | Apache 2.0   | Ionicons 4 and 5       | MIT          |
| Bootstrap Icons        | MIT          | Line Awesome           | MIT          |
| Phosphor               | MIT          | Radix Icons            | MIT          |
| Remix Icon             | Apache 2.0   | Simple Line Icons      | MIT          |
| Feather                | MIT          | Themify Icons          | MIT          |
| Ant Design Icons       | MIT          | Typicons               | CC BY-SA 3.0 |
| BoxIcons               | MIT          | VS Code Codicons       | CC BY 4.0    |
| css.gg                 | MIT          | Weather Icons          | SIL OFL 1.1  |
| Circum Icons           | MPL 2.0      | Game Icons             | CC BY 3.0    |
| Devicons               | MIT          | Flat Color Icons       | MIT          |

Brand logos (Simple Icons, Devicons) are trademarks of their owners; use them only to point to your own profiles and projects.

## How icons are loaded

The sets together hold more than 50,000 icons, so they are never all downloaded:

- Each set is a separate file, loaded the first time it is opened in the icon window or used by a resume.
- Lucide is small and used by the contact line, so the app keeps it for offline use from the first visit. Other sets are kept for offline use once they have been loaded.
- Until a set has loaded, an empty space of the same size holds its place, so page breaks do not move.
- A resume stores only the set and the icon name (for example `lu` / `LuBriefcase`). Both are checked against strict patterns, and icons are drawn as React components, never from stored markup.

## Code map

| File                                         | Purpose                                                    |
| -------------------------------------------- | ---------------------------------------------------------- |
| `src/lib/photo.ts`                           | Crop maths, aspect presets, size guide                     |
| `src/lib/photo-canvas.ts`                    | Reading, shrinking, turning and cropping pictures          |
| `src/components/photo/PhotoField.tsx`        | The photo panel in Profile                                 |
| `src/components/photo/PhotoCropDialog.tsx`   | The crop window                                            |
| `src/components/photo/PhotoSizeGuide.tsx`    | Print resolution label                                     |
| `src/config/icon-sets.ts`                    | The icon sets, licences and contact-line icons             |
| `src/lib/icons/search.ts`                    | Name splitting, synonyms and ranking                       |
| `src/lib/icons/registry.ts`                  | Loading each set on demand                                 |
| `src/components/icons/ResumeIcon.tsx`        | Draws an icon on the page                                  |
| `src/components/icons/IconPicker.tsx`        | The icon window                                            |

---

Previous: [Pages and printing](11-pages-and-printing.md) · Next: [Import and export](13-import-and-export.md) · [Docs home](README.md) · [Main README](../README.md)
