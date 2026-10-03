# Asir Guide

## What it does

Asir Guide is a bilingual Arabic and English landing page that introduces visitors to the nature, heritage, destinations, activities, stays, food, and visual character of Asir.

## Who it is for

It is for visitors who want a simple starting point for exploring Asir and planning a local travel experience.

## Needs

A modern web browser. The page is fully local and needs no internet connection, account, API key, library, or installation.

## How to run it

Open `index.html` directly in a modern browser by double-clicking it. There is no server or build step.

Use the `AR / EN` control in the header to switch languages. The page changes direction automatically between Arabic right-to-left and English left-to-right, and remembers the selected language after refresh.

The main hero is a four-region slider in this order: Abha, Tanomah, Al-Namas, then Rijal Almaa. It uses local copies of three photographed locations, while Tanomah remains a clearly illustrated temporary fallback because a free photo specifically identified as Tanomah was not available during source checking. Abha and Al-Namas use several calm, translucent mist layers above their local photos; the layers move at different speeds and in different directions only while their slide is active and stay still when reduced motion is enabled.

The hero advances every five seconds, pauses on hover, focus, or touch, and offers previous/next, dot, and play/pause controls. A browser reduced-motion preference stops automatic rotation and decorative motion while retaining manual controls.

### Hero photo sources and licenses

The following files are stored locally in `images/hero/`; opening `index.html` does not load images from the network.

- `abha-al-sawda.jpg` — [Abha / Al Sawda mountain route](https://commons.wikimedia.org/wiki/File:Abha-_Saudi_Arabia_-_on_the_way_to_Al_Sawda_(2518041457).jpg), by marviikad, [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).
- `al-namas.jpg` — [Al-Namas](https://commons.wikimedia.org/wiki/File:Al-Namas.jpg), by مشعل السيد, public domain.
- `rijal-almaa.jpg` — [Rijal Almaa village](https://commons.wikimedia.org/wiki/File:Rijal_Almaa_village_2021.jpg), by Richard Mortel, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).

The Destinations section is a four-stop slider in this order: Abha, Tanomah, Al-Namas, then Rijal Almaa. It changes automatically every five seconds, pauses while the slider is hovered, focused, or touched, and resumes after interaction ends. Use the previous/next arrows or destination dots to move through it immediately, or use the play/pause control to keep automatic rotation stopped. The Rijal Almaa card includes descriptive Heritage, Architecture, and Nature tags; they are labels, not filters. A browser reduced-motion preference disables automatic movement while keeping the controls available.

The Stays & Hotels section first asks the visitor to choose Abha, Tanomah, Al-Namas, or Rijal Almaa. It shows one regional Booking.com search for the selected area, rather than unverified individual accommodation listings. Its local regional images are illustrative only and are not photos of a property; it deliberately shows no prices, ratings, reviews, availability, or checkout data. The Booking.com action opens in a new tab and needs internet access.

The Cafés & restaurants section first asks the visitor to choose Abha, Tanomah, Al-Namas, or Rijal Almaa. It then shows the selected region’s suggestions with All, Cafés, and Restaurants filters, a return action, and one Google Maps link per card that opens in a new tab. Abha contains Near Cafe and Sadf Restaurant, each with its local venue photo. The page opens and renders offline; internet access is only needed after choosing a Google Maps action.

## Try it with the sample data

The page uses local CSS illustrations for temporary visual content and locally stored, credited photographs in the main hero. Replace the remaining Tanomah illustration later with an appropriately licensed local photograph when one is available.

Built with Claude Code during the KKU Claude Code hackathon

Started on 2026-10-01
