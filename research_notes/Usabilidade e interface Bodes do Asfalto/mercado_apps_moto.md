# Market of motorcycle and car navigation apps: UX patterns, praise and complaints (for Bodes do Asfalto)

Research date: 12/11/2026. Method: web searches (about 20). **Limitation:** in this session, full-page fetches failed for most sites (motoridez.com, cardosystems.com, handlebarhq.com and gazetasp.com.br were blocked by the session network). Many findings below come from search-result summaries of the cited pages, not from reading each page in full. Source labels: **[DOC]** = official documentation or the company's own material; **[PRESS]** = press or review site; **[REVIEW]** = user reviews, forums or review aggregators (anecdotal); **[AGG]** = automated review-analysis site (weak evidence).

## 1. Competitor UX: home, planning, riding screen, group ride, SOS, offline, battery, voice

### Takeaway
The field splits three ways. Curvy-route planners (calimoto, Kurviger, Scenic, REVER) put turn-by-turn navigation and offline maps behind a paywall. Hardware ecosystems (Cardo, Garmin, Beeline, BMW, Harley) tie safety features to devices. Mass-market car apps (Waze, Google Maps) now ship free motorcycle modes, including Waze in Brazil since 07/2026. Group riding and crash/SOS features are still immature or paid (calimoto Group Rides in beta; Cardo PackRide and live tracking paid). That leaves room for free convoy and SOS.

### Cited Findings
**Curvy-route planners (comparisons)**
- calimoto is described as the best-known app for scenic and curvy routing, strongest in Europe. Offline maps and turn-by-turn navigation are in paid Premium; the free tier covers planning and tracking. [PRESS] — [Endurrad 2026 comparison](https://endurrad.com/en/blogs/news-motorcycle-accessories/app-navigazione-moto); [Bikes and Bays offline apps 2026](https://bikesandbays.com/blog/best-offline-motorcycle-navigation-apps/); [motoridez comparison](https://motoridez.com/blog/curvy-route-apps-compared/) (search summary only)
- Kurviger is praised for its "curviness" control and desktop/web route planner. Offline maps and voice navigation require the paid Tourer+ plan. [PRESS] — [motoridez](https://motoridez.com/blog/curvy-route-apps-compared/); [Revamigo 2026](https://www.revamigo.com/best-motorcycle-apps/)
- Scenic is described as the "most pleasant to use" and the strongest for CarPlay/Android Auto (CarPlay/AA in its free tier). It is also praised for its ride diary, GPX handling and a battery-saving mode. [PRESS] — [motoridez](https://motoridez.com/blog/curvy-route-apps-compared/); [HandlebarHQ 2026](https://www.handlebarhq.com/navigation/best-motorcycle-navigation-apps/)
- REVER has the largest community and route library (North America), but weaker planning tools. Advanced planning and offline maps sit in REVER Pro. [PRESS] — [motoridez](https://motoridez.com/blog/curvy-route-apps-compared/); [MotoVault 2026](https://motovault.app/blog/best-motorcycle-trip-planner-apps)
- REVER "LiveRIDE" (2019) sends SMS to chosen contacts at ride start and finish with a location link. "Friend Tracking" lets a friend follow the ride live. [DOC, dated] — [REVER press release](https://rever.co/press-releases/rever-introduces-liveride-a-collection-of-safety-features-to-keep-friends-and-family-informed-while-you-ride)

**Group ride (convoy)**
- calimoto Group Rides is labeled **beta** ("minor bugs may occur"). Riders sharing location show as a blue dot on the group map, and a position updates in real time only while the rider is moving. Invites work by username, recent contacts, share link or **QR code**. The earliest blog date found is 28/02/2025. [DOC] — [calimoto support: Group Rides](https://support.calimoto.com/hc/articles/17480044307356); [calimoto blog: group riding](https://calimoto.com/en/our-motorcycle-blog/group-riding)
- Cardo Ride (the renamed RISER app) offers PackRide, live group positions on a map, but in the **paid Pro tier**. Live tracking via a shared link is also Pro. Without Pro, Pack Ride is limited to **30 minutes** unless the Pack Leader pays. The free tier records the ride into a "Roadbook". [DOC/PRESS] — [Cardo blog launch](https://cardosystems.com/blogs/cardo-blog/cardo-ride-app-launch/); [Rider Magazine](https://ridermagazine.com/cardo-ride-app-gets-updated-features/); [RISER journal: how to use Cardo Ride](https://journal.riserapp.com/how-to-use-the-riser-app/)
- REALRIDER offers free group rides with live location for up to 12 friends, plus crash detection. [DOC store listing] — [REALRIDER App Store](https://apps.apple.com/us/app/id1080699050)
- I found no competitor documenting a "fell behind" or "regroup" alert in the sources I could reach (see Gaps).

**SOS / crash detection**
- Garmin incident detection: a message appears on the device and phone saying contacts will be informed after **30 seconds**, with **Cancel > Yes** to abort. Emergency contacts must be set up beforehand in the Garmin Connect app. It needs a phone with data, does **not** call emergency services, and is a "supplemental feature." Some Garmin Drive models use a **60-second** countdown. [DOC] — [Garmin Edge manual](https://www8.garmin.com/manuals-apac/webhelp/edge1030plus/EN-SG/GUID-E65131D8-0187-4292-9E6C-BB648371D740-3633.html); [Garmin zūmo 396: cancelling an incident notification](https://www8.garmin.com/manuals/webhelp/zumo396/EN-GB/GUID-DD2612E8-290D-47EC-9C78-07A3392DFE61.html)
- Cardo crash detection lives in the Packtalk Pro hardware and needs "Unit, Phone, and Cloud" working together. It covers on-road/tarmac only, is available in selected regions, and can be set to manual or off. [DOC/PRESS] — [Cardo Packtalk Pro support](https://cardosystems.com/pages/support/packtalk-pro); [Visordown](https://www.visordown.com/news/product-news/range-topping-cardo-packtalk-pro-launched-crash-detection-tech)
- EatSleepRIDE and eTrax Rider use phone sensors (sudden deceleration and impact) for crash detection running in the background. [PRESS] — [Adventure Bike Rider](https://www.adventurebikerider.com/?p=433707); [ADVPulse](https://www.advpulse.com/?p=60009)

**Hardware and OEM apps**
- Beeline Moto II: big white arrow, turn dot and countdown distance. There is no voice guidance, which reviewers found acceptable. It is easier to read in bright sunlight than phone apps, the phone screen can stay off, and battery life is better. MCN calls it "still not a full sat nav replacement." Moto II moved to a map-style turn-by-turn view, with arrow/compass mode kept. [PRESS/REVIEW] — [MCN review](https://motorcyclenews.com/bike-kit/accessories/beeline-moto-ii-review); [Rider Magazine 02/2025](https://ridermagazine.com/2025/02/06/beeline-moto-ii-motorcycle-navigation-device-review/); [Bennetts](https://bennetts.co.uk/bikesocial/reviews/products/motorcycle-technology/beeline-moto-ii-2-review); [itsbetterontheroad](https://itsbetterontheroad.com/gear/beeline-moto-ii-review/)
- BMW Motorrad Connected: an automated analysis of 1,712 reviews labels 66% negative (crude NLP). Complaints: an incoming phone call disconnects the app and navigation is lost; map errors; a forum owner calls it a "really clunky interface." [AGG/REVIEW] — [JustUseApp BMW](https://justuseapp.com/en/app/1250173746/bmw-motorrad-connected/reviews); [UKGSer forum](https://www.ukgser.com/community/threads/bmw-motorrad-connected-app-and-navigation.354599/latest); [BMWMOA forum: ride recording lost mid-ride](https://forums.bmwmoa.org/threads/connected-ride-app-loses-ride-recording-midway-through-ride.106495/latest)
- Harley-Davidson App: aggregated App Store feedback cites route downloads to the bike failing, persistent bugs, unreliable GPS tracking and poor navigation. [AGG, weak] — [Kimola report](https://kimola.com/reports/unlock-user-feedback-insights-on-harley-davidson-app-app-store-us-154563)
- TomTom GO Ride was **discontinued** (map services shut 15/09/2024). TomTom points users to AmiGO (motorcycle profile, winding routes, CarPlay/AA). [DOC] — [TomTom help: GO Ride discontinuation](https://help.tomtom.com/hc/en-au/articles/20233014604818-GO-Ride-app-discontinuation)
- Sygic launched a "Motorbike Mode" for CarPlay/Android Auto used on bike displays. [PRESS] — [SmartWorld.it](https://www.smartworld.it/news/sygic-motorbike-mode-carplay-android-auto-moto.html)

**Car-app platform guidance**
- Android Auto design system: minimum touch target **76 × 76 dp**, no overlapping targets, at least **23 dp** between targets where possible. Guidance has moved to docs.partner.android.com/drivingux. [DOC] — [Android Auto sizing](https://developers.google.com/cars/design/android-auto/design-system/sizing)
- Google Maps announced turn-by-turn and ETA on the iPhone Lock Screen and Dynamic Island (Live Activities), enabled in Settings > Navigation. The rollout status could not be confirmed. [PRESS] — [MacRumors](https://www.macrumors.com/2023/02/08/google-maps-to-support-live-activities); [9to5Google 04/2024](https://9to5google.com/2024/04/24/google-maps-live-activity-iphone-testing/)

### Inferences
- The Bodes do Asfalto decision to keep **SOS, alerts and convoy free** is a real differentiator: Cardo charges for PackRide and live links, calimoto's group feature is beta, and crash detection is mostly hardware-bound.
- SOS UX convention: a large countdown (30 s is the norm, 60 s on some devices), one very large "Cancel" target, contacts set up **before** the first ride, and a clear "does not call 192/193" disclaimer, as Garmin does.
- Convoy invite by **QR code and link** (calimoto) fits a club stop: everyone scans the leader's phone.
- Beeline shows that a **giant arrow + countdown distance**, readable in sun, beats a detailed map for riders. That supports a huge maneuver card on the riding screen and a low-power "arrow only" mode.
- Our 6 riding buttons of ~100 px and 5 car buttons of 66 px should be checked against Android Auto's 76 dp minimum. In Android Auto/CarPlay the templates control sizing anyway.

### Gaps
- I could not read the full pages of calimoto, Kurviger, Scenic or Cardo, so exact screen layouts (maneuver card position/size, speedometer placement) are not documented here. They need hands-on screenshots.
- No source found for any app with a documented "fell behind" or "regroup" alert. It may be a gap in the market or just in my searches.
- Current 2026 prices for calimoto Premium, Kurviger Tourer+, Scenic and REVER Pro were not found. The search returned unrelated results.
- Onboarding flows of each app: not found.

## 2. User review analysis: complaints and praise

### Takeaway
The most consistent complaints are about subscriptions and cancellation, navigation that stops or loses connection mid-ride, and phone heat and battery drain (often a phone and mount problem rather than an app problem). The most praised features are curvy-route creation, sunlight readability, battery-saver modes and long-term reliability.

### Cited Findings
- calimoto: Google Play 4.2/5 (about 50k reviews), App Store developer average 4.6 (979 ratings). [AGG] — [chrome-stats calimoto](https://chrome-stats.com/d/com.calimoto.calimoto); [unstar.app calimoto](https://unstar.app/developer/calimoto-gmbh-ios-1209129602)
- calimoto Trustpilot: a subscription renewed despite a cancellation attempt on the website, and another reviewer called cancellation "overly complicated." Praise for route creation and speed-camera alerts, plus one reviewer who used it 4 years on multi-week trips. [REVIEW] — [Trustpilot calimoto](https://ie.trustpilot.com/review/calimoto.com)
- calimoto Play reviewer: navigation stopped partway through a ride, and they cancelled. Product Hunt reviewer: premium "not worth" the price. [REVIEW] — [grand-screen reviews](https://grand-screen.com/apps/calimoto-motorcycle-gps/reviews/); [Product Hunt](https://www.producthunt.com/posts/calimoto/reviews)
- Phone heat: an iPhone showed "charging on hold due to high battery temperature" on 3 rides, even in a tank bag. Keeping an OLED screen lit drives heat; dark mode was estimated to save roughly 14–60% battery (user estimate). Some blame Android Auto rather than the app. Dedicated CarPlay/AA screens (Carpuride, Chigee) are used so the phone stays in shade. [REVIEW, MyRoute-app forum] — [MRA forum: overheating phone](https://mracommunity.nodebb.com/topic/8885/over-heating-phone/7); [MRA: dealing with heat](https://mracommunity.nodebb.com/post/51782); [Chigee blog](https://www.chigee.com/blogs/riding-life/chigee-phone-battery-draw-fast)
- Scenic's battery saver setting is reported to prevent overheating. The App Store listing itself warns that a feature "can dramatically decrease battery life." [REVIEW/DOC] — [MRA forum post](https://forum.myrouteapp.com/post/21570); [Scenic App Store](https://apps.apple.com/us/app/id1089668246)
- TomTom GO Ride (before shutdown): JustUseApp put it at 61.8% negative on a tiny sample (13 reviews), with an App Store average of about 4.25–4.5. A German review praised reliable, free navigation but missed lean-angle and curve playback. [AGG] — [JustUseApp TomTom](https://justuseapp.com/en/app/1620792783/tomtom-go-ride-motorcycle-gps/reviews)
- BMW Connected (66% negative, NLP) and Harley-Davidson app complaints center on connectivity loss and unreliable navigation. [AGG] — see section 1 sources.

### Inferences
- Riders forgive missing features but not **losing navigation mid-ride** or **surprise billing**. Use native store subscription management (RevenueCat), and offer a one-tap "how to cancel" in the app.
- A true dark map, a screen-dimming "economy" mode and an "arrow only" mode address the most recurring physical complaint (heat and battery).
- Incoming phone calls must not kill navigation (the BMW complaint). Handle audio focus and interruptions explicitly.

### Gaps
- Reddit r/motorcycles, ADVrider and Brazilian YouTube comment threads did not come back from searches. I have no quantified Reddit theme counts.
- No source found specifically about **glove usability** complaints. This is commonly asserted but not cited here.
- Review-theme percentages come only from automated aggregators (weak).

## 3. Monetization UX

### Takeaway
Competitors put **navigation and offline maps** behind premium and, in Cardo's case, even group tracking. The strongest user anger is about cancellation and renewal, not about the existence of a paywall.

### Cited Findings
- calimoto, Kurviger, Scenic and REVER all put offline maps and/or turn-by-turn navigation in paid tiers, while planning and recording stay free. [PRESS] — [motoridez](https://motoridez.com/blog/curvy-route-apps-compared/); [Bikes and Bays](https://bikesandbays.com/blog/best-offline-motorcycle-navigation-apps/)
- Scenic includes CarPlay/AA in the free tier. [PRESS] — [motoridez](https://motoridez.com/blog/curvy-route-apps-compared/)
- Cardo: PackRide time-limited to 30 min unless the leader is Pro. The leader pays, the group benefits. [DOC] — [Cardo blog](https://cardosystems.com/blogs/cardo-blog/cardo-ride-app-launch/)
- Cancellation complaints for calimoto. [REVIEW] — [Trustpilot](https://ie.trustpilot.com/review/calimoto.com)
- Waze and Google Maps motorcycle modes are free. [PRESS] — [Olhar Digital](https://olhardigital.com.br/2026/07/13/carros-e-tecnologia/waze-ganha-modo-para-motos-e-muda-a-forma-de-calcular-rotas/); [Tecnoblog Google Maps moto BR](https://tecnoblog.net/308842/google-maps-com-navegacao-para-motos-brasil/)

### Inferences
- Since free Waze and Google Maps already give Brazilian riders voice turn-by-turn, the Bodes Premium (curve-by-curve navigation) has to justify itself through club-specific value: curvy routes, the club's route library, the ride diary, offline regions and the car integration.
- Cardo's "leader pays, group benefits" pattern is a possible future idea. It does not apply to the current rule that convoy is free.
- Never show a paywall in riding mode. Show it only in planning or settings, with the 7-day trial clearly dated.

### Gaps
- No source found for how each app visually presents its paywall or trial screens (needs screenshots).

## 4. Brazilian market specifics

### Takeaway
In Brazil, Waze and Google Maps are the default navigators. Waze launched a free **Modo Moto** in Brazil on 13/07/2026, with voice hazard alerts through the Bluetooth helmet intercom. WhatsApp live location is the de facto group-sharing tool. Dedicated curvy-route apps are niche and mostly foreign.

### Cited Findings
- Waze Modo Moto launched in Brazil on **13/07/2026** (also in Argentina, Colombia, Malaysia, Mexico, Peru and the Philippines). It has motorcycle-specific routes, voice alerts for potholes, speed bumps and other hazards, and integration with Bluetooth helmet audio. It shipped alongside a global "Menos Falante" (less talkative) voice mode with Gemini AI. [PRESS] — [Times Brasil/CNBC](https://timesbrasil.com.br/empresas-e-negocios/tecnologia-e-inovacao/waze-modo-moto-e-novos-recursos-de-ia-chegam-ao-brasil-nesta-segunda-13/); [Olhar Digital](https://olhardigital.com.br/2026/07/13/carros-e-tecnologia/waze-ganha-modo-para-motos-e-muda-a-forma-de-calcular-rotas/); [Jornal do Comércio](https://www.jornaldocomercio.com/economia/2026/07/1255992-waze-lanca-modo-moto-no-brasil-para-evitar-acidentes-e-buracos.html); [O Hoje](https://ohoje.com/2026/07/13/novidades-waze-modo-motos-menos-falante/)
- Platform conflict: most outlets say Android and iOS, while Canaltech says Android only at first. [PRESS] — [Canaltech](https://canaltech.com.br/apps/waze-vai-falar-menos-nas-viagens-e-enfim-ganha-modo-para-motos) vs [Mobile Time](https://www.mobiletime.com.br/noticias/13/07/2026/waze-opcao-para-motos/)
- Correio 24 Horas describes a Waze AI feature that "converses" with the rider and warns of accidents without hands leaving the handlebars. [PRESS] — [Correio 24 Horas](https://www.correio24horas.com.br/transito/novo-recurso-do-waze-usa-inteligencia-artificial-para-conversar-com-o-motociclista-e-avisar-sobre-acidentes-sem-que-ele-precise-tirar-as-maos-do-guidao-0726)
- Google Maps has had a motorcycle navigation mode in Brazil and lets users share the trip in real time, including via WhatsApp. [PRESS] — [Tecnoblog](https://tecnoblog.net/308842/google-maps-com-navegacao-para-motos-brasil/); [Tecnoblog: share via WhatsApp](https://tecnoblog.net/noticias/google-maps-compartilhar-localizacao-rota/)
- WhatsApp live location: in a group, every sharer appears on one shared map, with a set duration and the option to stop at any time. A Brazilian outlet advises against sharing in groups where you don't know all members and recommends auto-expiry. [DOC/PRESS] — [WhatsApp blog](https://blog.whatsapp.com/share-your-live-location?lang=pt); [Tecnoblog](https://tecnoblog.net/226280/whatsapp-localizacao-tempo-real/); [Jivochat](https://www.jivochat.com.br/blog/recursos/localizacao-em-tempo-real-no-whatsapp.html)
- Brazilian "best apps" lists cite calimoto, Scenic, REVER and Two Wheel Ride. calimoto is pitched as scenic routing "without deep planning." [PRESS] — [Canaltech: melhores aplicativos motociclistas](https://canaltech.com.br/apps/melhores-aplicativos-motociclistas/); [Portal do Trânsito](https://www.portaldotransito.com.br/noticias/mobilidade-e-tecnologia/os-melhores-aplicativos-para-quem-vive-na-estrada/)

### Inferences
- Brothers will compare the app with Waze, which is free, in Portuguese, has hazard voice alerts and works with the intercom. Voice prompts in natural pt-BR, routed to the intercom, are table stakes. A "fala menos" (less talk) option mirrors Waze's direction.
- WhatsApp live location is the convoy tool the app replaces. The app must beat it on privacy (approximate position, automatic expiry, club-only) while still offering "Enviar pelo WhatsApp" for SOS and routes. This matches the decided SOS design.
- A useful pattern to copy from WhatsApp: duration chosen at share time ("por 1 h / 2 h / até o fim do passeio").

### Gaps
- No source found on "Rotas de Moto" or on Brazilian motoclube-specific apps, and no usage-share data (e.g., % of Brazilian riders using Waze vs Google Maps).
- No Brazilian YouTube or forum review analysis was obtained.

## 5. 2024–2026 design trends

### Takeaway
Material 3 Expressive (05/2025) brings research-backed bigger, bolder, high-contrast components that reportedly helped 45+ users. That fits the club's 40–60 age profile and its Barlow Condensed / large-button direction. Apple's Liquid Glass (iOS 26) drew legibility criticism, and Apple added ways to reduce it. For a road app, adopt translucency at most for system chrome and keep opaque, high-contrast surfaces for riding UI.

### Cited Findings
- Material 3 Expressive was officially unveiled at "The Android Show: I/O Edition" on 13/05/2025 and debuted with Android 16 on Pixel. [PRESS] — [Android Authority](https://androidauthority.com/material-design-expressive-google-io-3545058/); [Tecnoblog](https://tecnoblog.net/noticias/material-3-expressive-esta-e-a-nova-cara-do-android/)
- The leaked or archived Google research post reported 46 studies with more than 18,000 participants. Users found key elements up to **4× faster**, and users **45+ performed on par with younger users**, credited to larger buttons and high-contrast containment. These figures come via press reports of the archived post, not Google's live site. [PRESS] — [Android Central](https://www.androidcentral.com/apps-software/android-os/google-leaked-its-own-design-process-for-material-3-expressive); [Gigazine](https://www.gigazine.net/gsc_news/en/20250506-android-material-3-expressive)
- Liquid Glass (iOS 26, launched 09/2025): an Apple Developer Forums thread reports excessive transparency and blur hurting readability. Apple toned it down in beta 3, and a later update (about 2 months after launch) let users reduce the transparency. UX experts cite cognitive load and accessibility regressions. "Reduce Transparency" is under Accessibility > Display & Text Size but is system-wide. [DOC forum/PRESS] — [Apple Developer Forums](https://developer.apple.com/forums/thread/811219); [TechRepublic](https://www.techrepublic.com/article/news-apple-ios-26-beta-3-liquid-glass/); [RTÉ Brainstorm 01/2026](https://rte.ie/brainstorm/2026/0130/1555904-liquid-glass-apple-design-user-experience-ux-problems-issues/); [Infinum](https://infinum.com/blog/apples-ios-26-liquid-glass-sleek-shiny-and-questionably-accessible/); [Heise](https://heise.de/-10445465); [BGR](https://bgr.com/tech/5-ios-26-liquid-glass-issues-that-apple-needs-to-fix-before-launch/)
- Dark/OLED UI saves battery and heat on long rides (user estimates of 14–60%). [REVIEW] — [MRA forum](https://mracommunity.nodebb.com/post/51782)
- Lock-screen glanceable navigation (Live Activities / Dynamic Island) is becoming expected in navigation apps (Google Maps announced it). [PRESS] — [MacRumors](https://www.macrumors.com/2023/02/08/google-maps-to-support-live-activities)
- Voice-first and less-talkative voice (Waze "Menos Falante", Gemini conversational alerts, 07/2026). [PRESS] — [Canaltech](https://canaltech.com.br/apps/waze-vai-falar-menos-nas-viagens-e-enfim-ganha-modo-para-motos)

### Inferences
- The project's DESIGN.md direction (dark "noite" background, opaque "sarja" cards, Barlow Condensed numerals, 48 px+ targets, ~100 px riding buttons) is aligned with M3 Expressive's evidence for older users. Recommend **not** adopting Liquid Glass translucency on the riding screen or on map overlays: sunlight, vibration and glance reading need opaque, high-contrast cards. On iOS, let the system tab bar adopt whatever iOS 26 renders natively, but keep app surfaces opaque.
- Candidates for later versions: an iOS Live Activity / Android ongoing notification showing next maneuver, distance and convoy status on the lock screen (lets the screen stay off and saves battery, like Beeline). Also haptics on critical confirmations (SOS sent, wave received).

### Gaps
- No CarPlay-specific Liquid Glass legibility tests found (one anecdotal user report of a blank Google Maps on CarPlay).
- No primary Google page with the M3 Expressive research figures was fetched (blocked network). Verify against the archived Google Design blog before quoting publicly.
- No source on Material 3 Expressive or Liquid Glass adoption by navigation apps specifically.
