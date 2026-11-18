Release: Diplomacy 1.3.0

Tag: diplomacy-v1.3.0

## [1.3.0](https://github.com/The-Diplomats/Diplomacy/compare/diplomacy-v1.2.0...diplomacy-v1.3.0) (2026-11-18)


### Features

* add invite-only sign-up and maintenance mode ([#113](https://github.com/The-Diplomats/Diplomacy/issues/113)) ([4b22e44](https://github.com/The-Diplomats/Diplomacy/commit/4b22e44d54b87a8cd5beec1af37fde6dd3852820))
* **worker:** add the LLM client and the ai-turns queue ([#122](https://github.com/The-Diplomats/Diplomacy/issues/122)) ([38e649c](https://github.com/The-Diplomats/Diplomacy/commit/38e649cbdf06f71faeededc3f39e07ca8a550f1c))


### Bug Fixes

* **auth:** accept real provider OAuth callbacks ([#102](https://github.com/The-Diplomats/Diplomacy/issues/102)) ([acd3f16](https://github.com/The-Diplomats/Diplomacy/commit/acd3f1605eca32378cf3e95a8b1c60eba389ab5f))
* **auth:** harden OAuth sign-in and document local setup + api scripts ([#106](https://github.com/The-Diplomats/Diplomacy/issues/106)) ([19ed344](https://github.com/The-Diplomats/Diplomacy/commit/19ed3441f6d2d92d2c5d806ffbe39bd1425a52dc))


### Documentation

* **platform:** add the Azure Container Apps runbook ([#118](https://github.com/The-Diplomats/Diplomacy/issues/118)) ([ddaa006](https://github.com/The-Diplomats/Diplomacy/commit/ddaa00662f369c6a891b46d7196dc515a263dc48))
* record Neon setup and Cloudflare DNS decisions ([#109](https://github.com/The-Diplomats/Diplomacy/issues/109)) ([5f4af7d](https://github.com/The-Diplomats/Diplomacy/commit/5f4af7d9053c20edd223bfb3b3d90e1110340003))
* record the Azure hosting decisions and add Static Web Apps to the runbook ([#120](https://github.com/The-Diplomats/Diplomacy/issues/120)) ([90eec27](https://github.com/The-Diplomats/Diplomacy/commit/90eec2726ebd0ca8fb262678a73903290d6e5d9c))


### Performance Improvements

* **worker:** poll idle queues less often ([#111](https://github.com/The-Diplomats/Diplomacy/issues/111)) ([1210335](https://github.com/The-Diplomats/Diplomacy/commit/1210335a4627d207131d58851b1e9edf989f2a66))


### Tests

* added tests for sending and receiving public messages ([#104](https://github.com/The-Diplomats/Diplomacy/issues/104)) ([bfe5d03](https://github.com/The-Diplomats/Diplomacy/commit/bfe5d03668bbbcb7052735bc3c24404b2aa1a8aa))


### CI

* build and push backend and worker images to GHCR ([#116](https://github.com/The-Diplomats/Diplomacy/issues/116)) ([51ee572](https://github.com/The-Diplomats/Diplomacy/commit/51ee5720a46fd578e911f2a5bb7254e63179c2e4))
* deploy the frontend to the dev Static Web App ([#119](https://github.com/The-Diplomats/Diplomacy/issues/119)) ([604433a](https://github.com/The-Diplomats/Diplomacy/commit/604433a7817fa36312cd280df743430c3cbe924d))
