# Manga Sources

## Overview

The Manga Reader now supports multiple manga image sources with different URL patterns. You can manage sources through the Settings panel and select which source to use when adding manga.

## Built-in Sources

### 1. Manga Pics (Default)
- **URL**: https://manga.pics
- **Pattern**: `{baseUrl}/{manga-slug}/chapter-{number}/{page}.jpg`
- **File Format**: JPG
- **Example**: `https://manga.pics/one-piece/chapter-1/1.jpg`

### 2. Black Clover CDN
- **URL**: https://cdn.black-clover.org
- **Pattern**: `{baseUrl}/file/leveling/{manga-slug}/chapter-{number}/{page}.webp`
- **File Format**: WebP
- **Path Prefix**: `/file/leveling`
- **Example**: `https://cdn.black-clover.org/file/leveling/hells-paradise/chapter-11/2.webp`

### 3. Raven Scans
- **URL**: https://ravenscans.com/manga
- **Pattern**: `{baseUrl}/{manga-slug}/chapter-{number}/{page}.jpg`
- **File Format**: JPG
- **Example**: `https://ravenscans.com/manga/some-manga/chapter-1/1.jpg`

## Managing Sources

### Accessing Source Manager
1. Open the app
2. Click the Settings icon
3. Scroll down to the "Manga Sources" section

### Adding a Custom Source
1. Click "Add Source"
2. Fill in the required fields:
   - **Source Name**: A friendly name for your source
   - **Base URL**: The base URL (e.g., `https://cdn.example.com`)
   - **Pattern Type**: Choose between:
     - **Standard**: `baseUrl/manga/chapter/page.ext`
     - **Prefixed**: `baseUrl/prefix/manga/chapter/page.ext`
   - **File Extension**: Image format (jpg, webp, png)
   - **Chapter Format**: How chapters are formatted (e.g., `chapter-{number}`)
   - **Path Prefix** (for prefixed type): The path prefix (e.g., `/file/leveling`)
3. Click "Save"

### Editing a Source
1. Click the Edit icon next to any source
2. Modify the fields
3. Click "Save"

### Activating/Deactivating Sources
- Click the Power icon to toggle a source's active status
- Inactive sources won't appear when adding new manga

### Deleting Custom Sources
- Only custom sources can be deleted
- Built-in sources can be deactivated but not deleted
- Click the Trash icon to delete a custom source

## Using Sources

### When Adding Manga
1. Click "Add New Manga"
2. Enter the manga name
3. **Select a source** from the dropdown
4. Choose discovery options
5. Add tags if desired
6. Click "Add Manga"

The app will automatically:
- Use the selected source's URL pattern
- Discover chapters and pages based on that source
- Store the source configuration with the manga

## URL Pattern Examples

### Standard Pattern
```
{baseUrl}/{manga-slug}/chapter-{number}/{page}.{extension}
```
Example: `https://manga.pics/one-piece/chapter-1052/15.jpg`

### Prefixed Pattern
```
{baseUrl}{pathPrefix}/{manga-slug}/chapter-{number}/{page}.{extension}
```
Example: `https://cdn.black-clover.org/file/leveling/hells-paradise/chapter-11/2.webp`

## Finding Manga Names

To ensure you're using the correct manga slug for each source:
- Check the source's website for the manga
- Look at the URL structure
- The manga slug is typically in kebab-case (lowercase with hyphens)
- Example: "Hell's Paradise" → `hells-paradise`

## Troubleshooting

### Manga not loading
1. Check if the source is active
2. Verify the manga slug matches the source's format
3. Try a different source
4. Check the source URL is accessible

### Chapter/Page discovery fails
1. Verify the URL pattern is correct
2. Check if the source uses a different numbering scheme
3. Try manually entering a known URL to verify the pattern

### Custom source not working
1. Double-check the base URL
2. Verify the path prefix (if using prefixed pattern)
3. Ensure the file extension matches the actual images
4. Test with a known manga from that source

