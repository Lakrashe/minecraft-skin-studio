# Minecraft Skin Studio — Product Specification

> **Source of truth.** This is the complete product specification provided by the
> project owner (2026-11-05). It describes the long-term vision. It is implemented
> in phases (§28); only the phase the owner explicitly requests is built at a time.
> See `docs/DEVELOPMENT_ROADMAP.md` for the build plan.
>
> Do not edit the requirements below without the owner's approval. Clarifications
> and decisions go in `docs/PROJECT_OVERVIEW.md` §Decisions.

---

## Owner instructions for development

This is the complete product specification for Minecraft Skin Studio.
Treat it as the long-term vision and source of truth for the entire project.
Do not attempt to implement every feature immediately.
First:

1. Analyze the complete requirements.
2. Review the existing project structure.
3. Propose the technical architecture.
4. Identify dependencies.
5. Identify technical risks.
6. Create a detailed implementation roadmap.

Implement only the development phase I explicitly request.
Preserve existing functionality throughout development.
Do not create fake buttons, simulated features or placeholder implementations for core functionality.
Prioritize a fully functional application over the number of features.
Wait for my approval before starting the first implementation phase.

---

## PROJECT: MINECRAFT SKIN STUDIO — ULTIMATE EDITION

Build a premium, fully functional Minecraft Skin Creation Platform called Minecraft Skin Studio.

The platform must allow users to create Minecraft skins from scratch, customize every pixel, import existing skins, generate skins using AI, preview characters in interactive real-time 3D, create outfits, produce cinematic renders, share creations and export skins compatible with Minecraft.

This should feel like a combination of:

* A professional pixel-art editor.
* A 3D character customization studio.
* An AI-powered creative platform.
* A Minecraft skin community and marketplace.

The goal is to create one of the best Minecraft skin creation platforms available online.

IMPORTANT: Build a real application, not just a visual prototype. Every main feature, button and interaction must work.

## 1. Branding and visual design

Create a premium gaming-oriented visual identity.

Design requirements:

* Dark mode by default.
* Elegant charcoal and near-black backgrounds.
* Minecraft-inspired green accent colors.
* Subtle gradients and lighting effects.
* Modern typography.
* Rounded panels and professional layouts.
* Smooth animations and transitions.
* Minimalist but information-rich interface.
* Responsive desktop, tablet and mobile layouts.

The interface should feel like professional creative software rather than a generic gaming website.

Brand name: Minecraft Skin Studio.

Create a custom logo and favicon.

Include:

* Light and dark themes.
* Customizable accent colors.
* Subtle hover effects.
* Loading animations.
* Toast notifications.
* Helpful tooltips.

## 2. Landing page

Create an impressive homepage.

HERO SECTION:

* Large interactive 3D Minecraft character.
* Character slowly rotates.
* Animated background.
* Headline: "Create Your Own Minecraft Identity."
* Subtitle: "Design every pixel. Customize every detail. Bring your character to life."
* Primary CTA: "Start Creating".
* Secondary CTA: "Explore Community Skins".

FEATURE SECTIONS:

* Advanced Pixel Editor.
* Real-Time 3D Preview.
* AI Skin Generator.
* Outfit Creator.
* Cinematic Showcase.
* Community Marketplace.

Also include:

* Featured skins.
* Trending creations.
* Popular creators.
* Recently published skins.
* User statistics.
* Testimonials.
* FAQ.
* Footer with useful links.

## 3. Advanced 2D skin editor

This is the core feature of the entire application.

Create a professional pixel-art editing environment.

CANVAS:

* Minecraft-compatible 64x64 skin canvas.
* Accurate Minecraft skin UV mapping.
* Zoom in and out.
* Pan around the canvas.
* Pixel grid toggle.
* Transparent background.
* Pixel-perfect drawing.
* Click and drag painting.

TOOLS:

* Pencil.
* Eraser.
* Paint bucket.
* Color picker.
* Eyedropper.
* Line tool.
* Rectangle tool.
* Selection tool.
* Move tool.
* Fill tool.
* Copy and paste.
* Undo and redo.
* Clear selection.
* Clear layer.
* Mirror drawing.
* Symmetry mode.

ADDITIONAL FEATURES:

* Adjustable brush size.
* Custom color palettes.
* Recently used colors.
* HEX input.
* RGB input.
* Color wheel.
* Saved palettes.
* Color replacement.
* Select by color.
* Keyboard shortcuts.
* Drawing history.
* Autosave.

Every pixel must be editable.

## 4. Character body part editing

Allow independent editing of:

* Head.
* Body.
* Left arm.
* Right arm.
* Left leg.
* Right leg.

Support:

* Classic Steve model.
* Slim Alex model.

Users must be able to select a body part and edit only that area.

Add an optional mirrored editing mode.

Allow users to switch between editing individual body parts and editing the complete skin texture.

## 5. Advanced skin layers

Implement Minecraft's two skin layers:

INNER LAYER:

* Head.
* Body.
* Arms.
* Legs.

OUTER LAYER:

* Hat.
* Jacket.
* Left and right sleeves.
* Left and right pants layers.

Features:

* Toggle visibility.
* Edit layers independently.
* Erase individual layers.
* Adjust visibility in the editor.
* Preview layers in 3D.
* Support transparent pixels.

The exported PNG must preserve the correct Minecraft skin layout.

## 6. Real-time interactive 3D viewer

One of the most important features.

Create a high-quality interactive 3D Minecraft character using Three.js or React Three Fiber.

The 3D character must update instantly whenever the user edits a pixel in the 2D editor.

3D CONTROLS:

* Rotate 360 degrees.
* Zoom in and out.
* Pan camera.
* Front view.
* Back view.
* Side view.
* Top view.
* Reset camera.
* Fullscreen mode.

MODEL OPTIONS:

* Steve model.
* Alex model.
* Outer layer toggle.
* Individual body part visibility.
* Wireframe mode.
* Texture inspection mode.

LIGHTING:

* Studio lighting.
* Natural daylight.
* Sunset.
* Neon lighting.
* Cinematic lighting.
* Custom lighting intensity.

ANIMATIONS:

* Idle.
* Walking.
* Running.
* Jumping.
* Waving.
* Dancing.
* Custom preview poses.

Allow users to pause animations and take screenshots.

The 3D model must accurately display the actual exported Minecraft skin, including transparent pixels and outer layers.

## 7. AI skin generator

Create an AI-powered skin generation feature.

Users can describe the skin they want using natural language.

Example prompts:

* "A futuristic black knight with glowing purple eyes."
* "A cute pink-haired anime character wearing a hoodie."
* "A medieval warrior with golden armor."
* "A cyberpunk character with neon blue details."
* "A dark ninja with a red mask."

FEATURES:

* Text-to-skin generation.
* Style selection.
* Color selection.
* Character gender presentation options.
* Clothing customization.
* Multiple generation variations.
* Regenerate.
* Refine existing designs.
* Generate individual clothing concepts.
* Convert generated designs into editable Minecraft-compatible pixel skins.

IMPORTANT:

AI generations must produce valid Minecraft skin textures, not just ordinary character illustrations.

Every generated skin must be editable in the 2D editor and previewable in 3D.

If an AI service is required, integrate an appropriate image-generation API through a secure backend. Never expose API keys in frontend code.

Include useful loading states and generation error handling.

## 8. Skin from image

Create a feature called "Skin from Image".

Allow users to upload:

* Photos.
* Drawings.
* Character illustrations.
* Anime references.
* Existing character artwork.

The application should analyze the uploaded image and use it as inspiration to create a Minecraft-compatible pixel-art skin.

FEATURES:

* Image upload.
* Image preview.
* Style selection.
* Color extraction.
* Palette generation.
* Automatic pixel-art conversion.
* Manual refinement.
* AI-assisted skin creation.
* 3D preview.

Allow users to modify the generated result before exporting.

Never simply stretch an image onto the skin texture. Generate a properly mapped Minecraft skin with correct body-part placement.

## 9. Outfit creator

Create a dedicated Outfit Creator.

Allow users to customize complete character appearances.

OUTFIT CATEGORIES:

* Shirts.
* Hoodies.
* Jackets.
* Pants.
* Armor.
* Hats.
* Masks.
* Gloves.
* Shoes.
* Accessories.

Use Minecraft's outer skin layer where appropriate.

Include:

* Clothing presets.
* Outfit templates.
* Color customization.
* Mix and match.
* Save outfits.
* Apply outfits to existing skins.
* Preview outfits in 3D.
* Outfit collections.

Users should be able to create different outfits without losing their original skin.

## 10. Random skin generator

Create a fun random generation tool.

Features:

* Generate random skin.
* Random color combinations.
* Random clothing.
* Random hairstyles.
* Random accessories.
* Random themes.
* Random character styles.

Allow users to lock specific parts before generating again.

For example, users can lock the head and regenerate only the outfit.

Every generated skin must be editable.

## 11. Skin templates and presets

Create a large library of editable templates.

CATEGORIES:

* Medieval.
* Fantasy.
* Futuristic.
* Cyberpunk.
* Anime-inspired.
* Horror.
* Military.
* Casual.
* Cute.
* Royal.
* Superhero.
* Gaming.
* Space.
* Nature.
* Winter.
* Summer.

Features:

* Preview in 3D.
* Preview in 2D.
* Apply template.
* Customize template.
* Save favorites.
* Search templates.
* Filter by category.

Templates must never be locked images. They must be actual editable skin textures.

## 12. Cinematic skin showcase

Create a dedicated feature called "Showcase Studio".

Allow users to create professional-looking renders of their Minecraft characters.

FEATURES:

* High-quality 3D character renders.
* Custom camera angles.
* Character poses.
* Background selection.
* Studio lighting.
* Shadows.
* Environment selection.
* Custom colors.
* Cinematic effects.
* Screenshot export.

BACKGROUND PRESETS:

* Studio.
* Minecraft grassland.
* Nether-inspired environment.
* End-inspired environment.
* Futuristic city.
* Neon room.
* Fantasy environment.
* Transparent background.

Allow exporting high-resolution images of the character.

The Showcase Studio should make skins look impressive when shared on social media.

## 13. Pose studio

Create a dedicated pose customization tool.

Users should be able to manipulate the character's body parts in 3D.

FEATURES:

* Rotate arms.
* Rotate legs.
* Adjust head rotation.
* Adjust body rotation.
* Custom standing poses.
* Walking poses.
* Action poses.
* Dancing poses.
* Sitting poses.
* Running poses.
* Save custom poses.
* Pose presets.
* Screenshot mode.

Include a reset pose button.

Allow users to save and reuse custom poses in Showcase Studio.

## 14. Before / after comparison

Create a comparison tool.

Allow users to compare:

* Original skin.
* Edited skin.
* AI-generated skin.
* Different skin versions.

Support:

* Side-by-side 2D comparison.
* Side-by-side 3D comparison.
* Interactive before/after slider.
* Synchronized character rotation.

## 15. Skin history and version control

Create a complete project history system.

Features:

* Automatic saving.
* Manual saving.
* Undo and redo.
* Version history.
* Restore previous versions.
* Duplicate projects.
* Rename projects.
* Delete projects.
* Export previous versions.

Allow users to experiment without worrying about losing their original creations.

## 16. Skin import and export

IMPORT:

* Import Minecraft skin PNG.
* Validate skin dimensions.
* Detect compatible skin format.
* Select Steve or Alex model.
* Edit imported skin.
* Preview imported skin in 3D.

EXPORT:

* Download Minecraft-compatible PNG.
* Export transparent character preview.
* Export 3D screenshots.
* Export showcase images.
* Save editable project files.
* Share project links.

Support the standard 64x64 Minecraft skin format and appropriate compatibility options for Java Edition and Bedrock Edition.

Include clear export options and explain any format limitations.

## 17. Community gallery

Create a social platform for sharing creations.

FEATURES:

* Public skin gallery.
* Trending skins.
* Newest skins.
* Most downloaded skins.
* Most liked skins.
* Featured creators.
* Search by skin name.
* Filter by category.
* Filter by style.
* User profiles.
* Creator pages.
* Like and favorite.
* Comments.
* Follow creators.
* Share skin links.
* Download community skins.
* Preview every skin in 3D.

Each skin must have its own detail page.

DETAIL PAGE:

* Interactive 3D preview.
* Skin name.
* Creator.
* Description.
* Tags.
* Download button.
* Like button.
* Favorite button.
* Comments.
* Similar skins.

## 18. Marketplace

Create a dedicated Skin Marketplace.

Users should be able to publish and distribute their creations.

FEATURES:

* Free skins.
* Optional paid skins.
* Outfit packs.
* Skin bundles.
* Premium templates.
* Creator profiles.
* Product descriptions.
* Ratings and reviews.
* Search and categories.
* Featured products.
* Creator collections.

Implement payment processing only through a secure payment provider and backend.

Include creator ownership, upload moderation and reporting tools.

Do not implement fake purchases or fake payment flows.

The marketplace should be optional and must not interfere with the free skin editor.

## 19. User accounts and profiles

Allow users to create accounts.

FEATURES:

* Sign up.
* Login.
* Password recovery.
* User profiles.
* Profile pictures.
* Username.
* Saved skins.
* Favorite skins.
* Personal projects.
* Published creations.
* Followed creators.
* Account settings.

Users should be able to use the editor without registering.

Require an account only for cloud saving, publishing, following and community interactions.

## 20. Sharing and social features

Allow users to share their creations.

FEATURES:

* Unique skin links.
* Shareable 3D previews.
* Social media preview images.
* Download links.
* Embed previews where technically supported.
* Creator pages.
* Public collections.

Create attractive Open Graph previews for shared skin pages.

## 21. Advanced color system

Create a powerful color customization panel.

FEATURES:

* HEX input.
* RGB input.
* Color wheel.
* Preset palettes.
* Custom palettes.
* Recently used colors.
* Saved colors.
* Color harmony generator.
* Complementary colors.
* Analogous colors.
* Random palettes.
* Global color replacement.
* Replace selected colors.

Allow users to save and reuse their favorite palettes.

## 22. Keyboard shortcuts

Add professional editor shortcuts.

Examples:

* Ctrl + Z: Undo.
* Ctrl + Y: Redo.
* Ctrl + S: Save.
* Ctrl + C: Copy.
* Ctrl + V: Paste.
* B: Pencil.
* E: Eraser.
* G: Fill.
* I: Eyedropper.
* Space: Pan canvas.

Create a keyboard shortcut reference panel.

## 23. Settings and accessibility

Include:

* Dark mode.
* Light mode.
* Accent color selection.
* Editor preferences.
* Canvas grid settings.
* Autosave settings.
* Animation preferences.
* Language selection.
* Keyboard shortcut customization.
* Accessible labels.
* Keyboard navigation.

Support English and Italian initially, with architecture ready for more languages.

## 24. Website structure

Create these main pages:

1. Home.
2. Skin Editor.
3. AI Skin Generator.
4. Skin from Image.
5. Outfit Creator.
6. Random Generator.
7. Templates.
8. Showcase Studio.
9. Pose Studio.
10. Community Gallery.
11. Skin Marketplace.
12. User Profile.
13. My Projects.
14. Settings.
15. Individual Skin Detail Pages.

Use consistent navigation throughout the website.

## 25. Editor interface layout

The main editor must use a professional creative-software layout.

TOP BAR:

* Project name.
* Undo.
* Redo.
* Import.
* Save.
* Export.
* Settings.

LEFT PANEL:

* Drawing tools.
* Color picker.
* Color palettes.
* Editing tools.

CENTER PANEL:

* Large 2D skin canvas.
* Pixel grid.
* Zoom controls.
* Body-part selection.
* Layer editing.

RIGHT PANEL:

* Interactive 3D character.
* Model selection.
* Camera controls.
* Animation controls.
* Lighting settings.

BOTTOM PANEL:

* Layer controls.
* Project history.
* Keyboard shortcuts.
* Status information.

Make the layout customizable where possible.

## 26. Technical stack

Recommended architecture:

FRONTEND:

* React.
* TypeScript.
* Tailwind CSS.
* Vite or Next.js.
* Zustand for state management.

2D ENGINE:

* HTML Canvas.
* Custom pixel editing engine.
* Accurate Minecraft UV mapping.

3D ENGINE:

* Three.js.
* React Three Fiber.
* Drei.
* Custom Minecraft character geometry and UV textures.

BACKEND:

* Supabase or equivalent.
* Authentication.
* Database.
* Cloud storage.
* User projects.
* Community data.

ADDITIONAL:

* Secure server-side API integrations.
* Image processing.
* AI generation integration.
* Payment provider for marketplace.
* Proper input validation.

## 27. Performance and code quality

IMPORTANT REQUIREMENTS:

* The editor must be genuinely functional.
* Every pixel must be editable.
* The 2D and 3D views must remain synchronized.
* Avoid unnecessary full-page rerenders.
* Use efficient texture updates.
* Optimize 3D rendering.
* Use lazy loading for galleries.
* Implement proper error handling.
* Implement autosave.
* Validate imported images.
* Protect user data.
* Keep API keys on the backend.
* Make the website responsive.
* Ensure browser compatibility.
* Use reusable components.
* Write clean, maintainable TypeScript.
* Include useful loading states.
* Do not create fake functionality.
* Do not leave non-functional buttons.
* Do not use placeholder content as a substitute for core functionality.

## 28. Development priorities

Build the application in phases.

PHASE 1 — CORE PRODUCT:

* Landing page.
* Fully functional 2D editor.
* 64x64 skin format.
* Steve and Alex support.
* Skin layers.
* Real-time 3D preview.
* PNG import.
* PNG export.
* Undo and redo.
* Local project saving.

PHASE 2 — CREATIVE TOOLS:

* Advanced color system.
* Templates.
* Random generator.
* Outfit Creator.
* Skin history.
* Showcase Studio.
* Pose Studio.
* Before/after comparison.

PHASE 3 — AI:

* AI Skin Generator.
* Skin from Image.
* AI-assisted refinements.
* Secure AI backend integration.

PHASE 4 — COMMUNITY:

* Authentication.
* User profiles.
* Cloud projects.
* Community Gallery.
* Likes and favorites.
* Comments.
* Sharing.

PHASE 5 — MARKETPLACE:

* Creator profiles.
* Free and premium skins.
* Bundles.
* Payment integration.
* Moderation and reporting.

Prioritize working functionality over visual complexity.

If a feature requires an external API or service, implement the appropriate integration architecture and clearly indicate any missing credentials. Never pretend that a feature works when it is not connected.

## 29. Final objective

Create the ultimate Minecraft Skin Studio.

Users should be able to:

1. Start with a blank skin or existing skin.
2. Draw and customize every pixel.
3. Generate designs using AI.
4. Turn images into Minecraft skin concepts.
5. Create and customize outfits.
6. Preview everything in real-time 3D.
7. Animate and pose their character.
8. Create cinematic screenshots.
9. Save and manage projects.
10. Export Minecraft-compatible skins.
11. Publish their creations.
12. Discover and download skins from other creators.

The final product should look and feel like a professional creative platform with a polished gaming aesthetic.

Make the editor the heart of the experience. The 2D pixel editor, accurate Minecraft UV mapping, and synchronized real-time 3D preview are non-negotiable.

Build a genuinely usable product, not just a beautiful mockup.
