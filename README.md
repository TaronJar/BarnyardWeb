# Barnyard — Browser Port

<p align="center">
  <strong>An unofficial browser port of <em>Barnyard</em>, powered by OpenBarnyard.</strong>
  <br />
  Play the game in a modern browser with WebAssembly.
  <br /><br />
  <a href="https://openbarnyard-wasm.pages.dev/"><strong>▶ Play Barnyard</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/InfiniteC0re/OpenBarnyard">Source project: OpenBarnyard</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Browser-20252d?style=flat-square" alt="Platform: browser" />
  <img src="https://img.shields.io/badge/WebAssembly-WASM-654ff0?style=flat-square" alt="WebAssembly" />
  <img src="https://img.shields.io/badge/Build-Emscripten-262626?style=flat-square" alt="Emscripten" />
  <img src="https://img.shields.io/badge/Hosting-Cloudflare%20Pages-f38020?style=flat-square" alt="Cloudflare Pages" />
</p>

---

**[English](#english) · [Русский](#русский)**

## English

**Barnyard — Browser Port** is an unofficial browser adaptation of [Barnyard](https://en.wikipedia.org/wiki/Barnyard_(video_game)), built on [OpenBarnyard](https://github.com/InfiniteC0re/OpenBarnyard).

It brings the OpenBarnyard game engine to modern browsers through **WebAssembly**, with a custom web interface for managing game data.

### Features

- Runs in a modern web browser
- WebAssembly build compiled with Emscripten
- Custom browser interface
- Two ways to provide game data:
  - Download the data pack through the web interface
  - Select an existing local `Data` folder
- Game data is stored locally on the device
- Save files are stored separately from game data

### Getting started

1. Open the [browser version](https://openbarnyard-wasm.pages.dev/).
2. Download the data pack or select your local `Data` folder.
3. Wait for the data to finish preparing.
4. Press **Play**.

> **Game data is not included.** You must provide your own copy of the original game data. This repository does not host or distribute proprietary game assets.

### Technology

| Component | Technology |
| --- | --- |
| Game runtime | WebAssembly |
| Build toolchain | Emscripten |
| Browser interface | HTML, CSS, JavaScript |
| Hosting | Cloudflare Pages |

### Credits

This project builds on [OpenBarnyard](https://github.com/InfiniteC0re/OpenBarnyard), a decompilation project for *Barnyard* and the TOSHI 2.0 engine.

- **AdventureT and InfiniteC0re** — original OpenBarnyard decompilation
- **Blue Tongue Entertainment** — original *Barnyard* game and TOSHI engine
- **THQ Nordic** — current owner of TOSHI

Barnyard — Browser Port is an independent, unofficial project. It is not affiliated with, endorsed by, or sponsored by the original developers or rights holders.

### License and disclaimer

This is a non-commercial fan project. It does not include or distribute the original game's proprietary assets or data. Users must provide their own game files.

The original OpenBarnyard license and attribution requirements apply. See [License.md](License.md) and the [OpenBarnyard repository](https://github.com/InfiniteC0re/OpenBarnyard) for details.

---

## Русский

**Barnyard — Browser Port** — неофициальный браузерный порт игры [Barnyard](https://en.wikipedia.org/wiki/Barnyard_(video_game)), созданный на основе [OpenBarnyard](https://github.com/InfiniteC0re/OpenBarnyard).

Проект переносит движок OpenBarnyard в современные браузеры с помощью **WebAssembly** и предоставляет веб-интерфейс для установки игровых данных.

### Возможности

- Запуск в современном браузере
- Сборка WebAssembly с помощью Emscripten
- Собственный веб-интерфейс
- Два способа добавить игровые данные:
  - Скачать пакет данных через интерфейс сайта
  - Выбрать существующую локальную папку `Data`
- Игровые данные сохраняются на устройстве
- Игровые сохранения хранятся отдельно от игровых данных

### Как запустить

1. Открой [браузерную версию](https://openbarnyard-wasm.pages.dev/).
2. Скачай пакет данных или выбери локальную папку `Data`.
3. Дождись завершения подготовки данных.
4. Нажми **Играть**.

> **Игровые данные не входят в проект.** Необходимо самостоятельно предоставить свою копию оригинальных игровых данных. Репозиторий не размещает и не распространяет защищённые авторским правом игровые ресурсы.

### Технологии

| Компонент | Технология |
| --- | --- |
| Игровая среда | WebAssembly |
| Сборка | Emscripten |
| Веб-интерфейс | HTML, CSS, JavaScript |
| Хостинг | Cloudflare Pages |

### Благодарности

Проект основан на [OpenBarnyard](https://github.com/InfiniteC0re/OpenBarnyard) — проекте по декомпиляции игры *Barnyard* и движка TOSHI 2.0.

- **AdventureT и InfiniteC0re** — авторы оригинальной декомпиляции OpenBarnyard
- **Blue Tongue Entertainment** — разработчики оригинальной игры *Barnyard* и движка TOSHI
- **THQ Nordic** — текущий правообладатель TOSHI

Barnyard — Browser Port — независимый неофициальный проект. Он не связан с оригинальными разработчиками или правообладателями, не одобрен и не спонсируется ими.

### Лицензия и отказ от ответственности

Это некоммерческий фанатский проект. Он не содержит и не распространяет оригинальные игровые ресурсы или данные. Пользователь должен самостоятельно предоставить игровые файлы.

На проект распространяются лицензионные условия и требования к указанию авторства исходного OpenBarnyard. Подробнее см. [License.md](License.md) и [оригинальный репозиторий OpenBarnyard](https://github.com/InfiniteC0re/OpenBarnyard).
