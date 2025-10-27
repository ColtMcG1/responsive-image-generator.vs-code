
# Responsive Image Generator

Generate responsive image tags and assets directly from VS Code.


https://github.com/user-attachments/assets/f0490cd2-be09-46e3-94b6-4702d7bd5cf9


## Features

- Add a new responsive image tag using completion (type `<responsive_image_basic>` and select the completion).
- Prompts for image file(s), output directory, and sizes.
- Automatically generates resized images and fills in the `srcset` and `sizes` attributes.
- Works in HTML, Markdown, JavaScript, TypeScript, Vue, and Angular files.

## Requirements

- Requires [Sharp](https://www.npmjs.com/package/sharp) (installed automatically).
- No additional configuration required for basic usage.

## Usage

1. Type `<responsive_image_basic>` in a supported file and trigger completion (Ctrl+Space).
2. Select the completion item.
3. Follow the prompts to select image(s), output folder, and sizes.
4. The extension generates responsive images and inserts a complete `<img>` tag with `srcset` and `sizes`.

## Extension Settings

You can customize the behavior of Responsive Image Generator using VS Code settings. Add these to your workspace or user `settings.json`:

```(json)
"responsiveImageGenerator.defaultSizes": [320, 480, 640, 960, 1280, 1600, 1920, 2560, 3840, 5120, 7680],
"responsiveImageGenerator.useRelativePaths": true,
"responsiveImageGenerator.staticAssetsRoot": ""
```

- **responsiveImageGenerator.defaultSizes**: List of image widths (in pixels) to generate by default.
- **responsiveImageGenerator.useRelativePaths**: If true, image paths in the generated tag will be relative; if false, absolute paths are used.
- **responsiveImageGenerator.staticAssetsRoot**: The base folder to use for relative paths in image tags. If left blank, the workspace root is used.

To change these, open VS Code settings and search for "Responsive Image Generator" or edit your `settings.json` directly.

## Known Issues

- Completion may not trigger automatically in all contexts; use Ctrl+Space if needed.
- Only works in supported file types (HTML, Markdown, JS, TS, Vue, Angular).
- Large images or many sizes may take time to process.

## Release Notes

### 1.1.0

- Source refactoring and code cleanup.
- Added a command to explorer context menu for generating responsive images from selected files.
- Added icon to editor title menu when an image file is open.
- Added contributors list.

### 1.0.0

- Added command for responsive image generation.
- Added support for multiple languages and snippet insertion.
- Added settings options for relative paths and public root folder.

## Contributors

[![Contributors](https://contrib.rocks/image?repo=ColtMcG1/responsive-image-generator.vs-code)](https://github.com/ColtMcG1/responsive-image-generator.vs-code/graphs/contributors)

---

**Enjoy using Responsive Image Generator!**
