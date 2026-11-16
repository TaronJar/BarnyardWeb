// The page's own settings (gear button in the top left corner), kept in localStorage.
// The game picks its resolution and canvas once, so changing those restarts it
var oPageSettings = {
	oValues : { szResolution : "auto", szLowLatency : "auto", szGrass : "auto", szDrawDistance : "auto", szSound : "auto", szFrameLimit : "0", szLanguage : "en", bShowFps : false, bSlowDevice : false , "Page from":"Versión de la página del", "Sound":"Sonido", "in the buffer (worst":"en el búfer (máximo", "target":"objetivo", "output":"salida", "gaps":"interrupciones", "skips":"saltos", "sounds start within":"los sonidos comienzan en menos de", "Files from":"Archivos desde", "this device":"este dispositivo", "the server":"el servidor", "slowest read":"lectura más lenta"},

	Load : function ()
	{
		var oStored = {};

		try
		{
			oStored = JSON.parse( localStorage.getItem( "oPageSettings" ) || "{}" );

			for ( var szKey in oPageSettings.oValues )
			{
				if ( oStored[ szKey ] !== undefined )
					oPageSettings.oValues[ szKey ] = oStored[ szKey ];
			}
		}
		catch ( e )
		{
		}

		// ?fps is only the default, the app always starts with it
		if ( location.search.indexOf( "fps" ) >= 0 && oStored.bShowFps === undefined )
			oPageSettings.oValues.bShowFps = true;
	},

	Save : function ()
	{
		try
		{
			localStorage.setItem( "oPageSettings", JSON.stringify( oPageSettings.oValues ) );
		}
		catch ( e )
		{
		}
	},

	// A known slow GPU, or one that ran slowly before
	IsSlowDevice : function ()
	{
		return oGLReplay.IsSlowGPU() || oPageSettings.oValues.bSlowDevice;
	},

	// The most lines the game draws, 0 for the whole screen
	GetMaxHeight : function ()
	{
		var szResolution = oPageSettings.oValues.szResolution;

		if ( szResolution == "full" )
			return 0;

		if ( szResolution != "auto" )
			return +szResolution;

		if ( !oGameInput.IsTouchDevice() )
			return 0;

		return oPageSettings.IsSlowDevice() ? 540 : 720;
	},

	IsLowLatency : function ()
	{
		var szLowLatency = oPageSettings.oValues.szLowLatency;

		if ( szLowLatency != "auto" )
			return szLowLatency == "on";

		return oPageSettings.IsSlowDevice();
	},

	IsLowGrass : function ()
	{
		var szGrass = oPageSettings.oValues.szGrass;

		if ( szGrass != "auto" )
			return szGrass == "low";

		return oPageSettings.IsSlowDevice();
	},

	GetDrawDistance : function ()
	{
		var szDistance = oPageSettings.oValues.szDrawDistance;

		if ( szDistance != "auto" )
			return +szDistance;

		return oPageSettings.IsSlowDevice() ? 75 : 100;
	},

	ApplyFrameLimit : function ()
	{
		if ( Module._WASM_SetFrameLimit )
			Module._WASM_SetFrameLimit( +oPageSettings.oValues.szFrameLimit || 0 );
	},

	// In auto mode a device that stays under 22 FPS for 30 seconds is slow from the next start on
	WatchFrameRate : function ()
	{
		if ( oPageSettings.oValues.szResolution != "auto" || oPageSettings.IsSlowDevice() || !oGameInput.IsTouchDevice() )
			return;

		var iLastFrames = 0, iSlowWindows = 0, iWindows = 0;

		var iTimer = setInterval( function () {
			var iFrames = Module.oStats.iFrames - iLastFrames;
			iLastFrames = Module.oStats.iFrames;

			// The first minute is loading
			if ( document.hidden || ++iWindows <= 6 )
				return;

			iSlowWindows = iFrames < 220 ? iSlowWindows + 1 : 0;

			if ( iSlowWindows >= 3 )
			{
				oPageSettings.oValues.bSlowDevice = true;
				oPageSettings.Save();
				clearInterval( iTimer );
				PageLog( "slow device, auto settings change on the next start" );
			}
		}, 10000 );
	},

	// The cheat codes are typed while Tab is held, phones have no keyboard for that
	EnterCheatCode : function ( a_szCode )
	{
		var aKeys = [ "Tab" ];

		for ( var szLetter of a_szCode.toUpperCase() )
		{
			if ( szLetter >= "A" && szLetter <= "Z" )
				aKeys.push( "Key" + szLetter );
		}

		if ( aKeys.length == 1 )
			return;

		function Send( a_szType, a_szCode )
		{
			window.dispatchEvent( new KeyboardEvent( a_szType, { code : a_szCode, key : a_szCode.replace( "Key", "" ).toLowerCase(), bubbles : true } ) );
		}

		// A press or release every two game frames (the game may read input a frame after the page shows one),
		// so the game sees each one however fast it runs
		var iStep = 0, iLastFrames = -2, fLastStep = 0;

		var iTimer = setInterval( function () {
			var iFrames = Module.oStats ? Module.oStats.iFrames : 0;
			var fNow    = performance.now();

			// Two frames passed, or the game isn't drawing (hidden) and it's been a while
			if ( iFrames - iLastFrames < 2 && fNow - fLastStep < 1000 )
				return;

			iLastFrames = iFrames;
			fLastStep   = fNow;

			var iKey = iStep >> 1;

			if ( iKey == aKeys.length )
			{
				Send( "keyup", "Tab" );
				clearInterval( iTimer );
				return;
			}

			if ( iKey == 0 )
			{
				if ( !( iStep & 1 ) )
					Send( "keydown", "Tab" );
			}
			else
			{
				Send( iStep & 1 ? "keyup" : "keydown", aKeys[ iKey ] );
			}

			iStep++;
		}, 4 );
	},

	ShowFps : function ( a_bShow )
	{
		var oFps = document.getElementById( "fps" );

		if ( !a_bShow )
		{
			if ( oFps )
			{
				clearInterval( oPageSettings.iFpsTimer );
				oFps.remove();
			}

			return;
		}

		if ( oFps )
			return;

		oFps    = document.createElement( "div" );
		oFps.id = "fps";
		document.body.appendChild( oFps );

		var iFpsFrames = Module.oStats.iFrames, fFpsTime = performance.now();

		oPageSettings.iFpsTimer = setInterval( function () {
			var fNow = performance.now();

			oFps.textContent = Math.round( ( Module.oStats.iFrames - iFpsFrames ) * 1000 / ( fNow - fFpsTime ) ) + " FPS";

			iFpsFrames = Module.oStats.iFrames;
			fFpsTime   = fNow;
		}, 500 );
	},

		CreatePanel : function ()
	{
		var oTranslations = {
			en : { Settings:"Settings", Display:"Graphics", Cheats:"Cheats", "Game data":"Game data", Stats:"Stats", Languages:"Languages", Resolution:"Resolution", "Low latency":"Low latency", "Grass detail":"Grass detail", "Draw distance":"Draw distance", "FPS limit":"FPS limit", Sound:"Sound", "Show FPS":"Show FPS", "Interface language":"Interface language", "Cheat code":"Cheat code", Enter:"Enter", Download:"Download", "From file":"From file", "From folder":"From folder", Delete:"Delete", "Update client":"Update client", "Update client hint":"Clear cached site files and reload the latest version.", Restart:"Restart", Close:"Close", "Edit touch buttons":"Edit touch buttons", "Auto":"Auto", "On":"On", "Off":"Off", "High":"High", "Low":"Low", "Full":"Full", "Smoother":"Smoother", "540 lines":"540p", "720 lines":"720p", "1080 lines":"1080p", "Screen":"Screen", "Restart hint":"Restarts the game. Saves are kept, progress since the last save is lost." , "Page from":"Page from", "Sound":"Sound", "in the buffer (worst":"in the buffer (worst", "target":"target", "output":"output", "gaps":"gaps", "skips":"skips", "sounds start within":"sounds start within", "Files from":"Files from", "this device":"this device", "the server":"the server", "slowest read":"slowest read"},
			ru : { Settings:"Настройки", Display:"Графика", Cheats:"Читы", "Game data":"Игровые данные", Stats:"Статистика", Languages:"Языки", Resolution:"Разрешение", "Low latency":"Низкая задержка", "Grass detail":"Детализация травы", "Draw distance":"Дальность прорисовки", "FPS limit":"Ограничение FPS", Sound:"Звук", "Show FPS":"Показывать FPS", "Interface language":"Язык интерфейса", "Cheat code":"Чит-код", Enter:"Ввести", Download:"Скачать", "From file":"Из файла", "From folder":"Из папки", Delete:"Удалить", "Update client":"Обновить клиент", "Update client hint":"Очистить кешированные файлы сайта и загрузить актуальную версию.", Restart:"Перезапустить", Close:"Закрыть", "Edit touch buttons":"Настроить сенсорные кнопки", "Auto":"Авто", "On":"Вкл.", "Off":"Выкл.", "High":"Высокая", "Low":"Низкая", "Full":"Полная", "Smoother":"Плавнее", "540 lines":"540p", "720 lines":"720p", "1080 lines":"1080p", "Screen":"Полноэкранный", "Restart hint":"Игра перезапустится. Сохранения останутся, несохранённый прогресс будет потерян." , "Page from":"Версия страницы от", "Sound":"Звук", "in the buffer (worst":"в буфере (максимум", "target":"цель", "output":"вывод", "gaps":"пропусков", "skips":"сбоев", "sounds start within":"звуки запускаются в пределах", "Files from":"Файлы загружаются с", "this device":"этого устройства", "the server":"сервера", "slowest read":"самое долгое чтение"},
			de : { Settings:"Einstellungen", Display:"Grafik", Cheats:"Cheats", "Game data":"Spieldaten", Stats:"Statistik", Languages:"Sprachen", Resolution:"Auflösung", "Low latency":"Geringe Latenz", "Grass detail":"Grasdetails", "Draw distance":"Sichtweite", "FPS limit":"FPS-Limit", Sound:"Ton", "Show FPS":"FPS anzeigen", "Interface language":"Oberflächensprache", "Cheat code":"Cheatcode", Enter:"Eingeben", Download:"Herunterladen", "From file":"Aus Datei", "From folder":"Aus Ordner", Delete:"Löschen", "Update client":"Client aktualisieren", "Update client hint":"Zwischengespeicherte Website-Dateien löschen und die aktuelle Version laden.", Restart:"Neustart", Close:"Schließen", "Edit touch buttons":"Touch-Steuerung bearbeiten", "Auto":"Auto", "On":"Ein", "Off":"Aus", "High":"Hoch", "Low":"Niedrig", "Full":"Voll", "Smoother":"Flüssiger", "540 lines":"540p", "720 lines":"720p", "1080 lines":"1080p", "Screen":"Bildschirm", "Restart hint":"Das Spiel wird neu gestartet. Spielstände bleiben erhalten, ungespeicherter Fortschritt geht verloren." , "Page from":"Seitenversion vom", "Sound":"Ton", "in the buffer (worst":"im Puffer (maximal", "target":"Ziel", "output":"Ausgabe", "gaps":"Lücken", "skips":"Aussetzer", "sounds start within":"Sounds starten innerhalb von", "Files from":"Dateien von", "this device":"diesem Gerät", "the server":"dem Server", "slowest read":"langsamster Lesevorgang"},
			fr : { Settings:"Paramètres", Display:"Graphismes", Cheats:"Codes", "Game data":"Données du jeu", Stats:"Statistiques", Languages:"Langues", Resolution:"Résolution", "Low latency":"Faible latence", "Grass detail":"Détail de l’herbe", "Draw distance":"Distance d’affichage", "FPS limit":"Limite FPS", Sound:"Son", "Show FPS":"Afficher les FPS", "Interface language":"Langue de l’interface", "Cheat code":"Code de triche", Enter:"Valider", Download:"Télécharger", "From file":"Depuis un fichier", "From folder":"Depuis un dossier", Delete:"Supprimer", "Update client":"Mettre à jour le client", "Update client hint":"Effacer les fichiers du site en cache et charger la dernière version.", Restart:"Redémarrer", Close:"Fermer", "Edit touch buttons":"Modifier les commandes tactiles", "Auto":"Auto", "On":"Activé", "Off":"Désactivé", "High":"Élevé", "Low":"Faible", "Full":"Complet", "Smoother":"Plus fluide", "540 lines":"540p", "720 lines":"720p", "1080 lines":"1080p", "Screen":"Écran", "Restart hint":"Le jeu redémarre. Les sauvegardes sont conservées, la progression non sauvegardée sera perdue." , "Page from":"Version de la page du", "Sound":"Son", "in the buffer (worst":"dans le tampon (maximum", "target":"cible", "output":"sortie", "gaps":"coupures", "skips":"sauts", "sounds start within":"les sons démarrent en moins de", "Files from":"Fichiers depuis", "this device":"cet appareil", "the server":"le serveur", "slowest read":"lecture la plus lente"},
			es : { Settings:"Ajustes", Display:"Gráficos", Cheats:"Trucos", "Game data":"Datos del juego", Stats:"Estadísticas", Languages:"Idiomas", Resolution:"Resolución", "Low latency":"Baja latencia", "Grass detail":"Detalle del césped", "Draw distance":"Distancia de dibujado", "FPS limit":"Límite de FPS", Sound:"Sonido", "Show FPS":"Mostrar FPS", "Interface language":"Idioma de la interfaz", "Cheat code":"Código de trucos", Enter:"Aplicar", Download:"Descargar", "From file":"Desde archivo", "From folder":"Desde carpeta", Delete:"Eliminar", "Update client":"Actualizar cliente", "Update client hint":"Borrar los archivos del sitio en caché y cargar la versión más reciente.", Restart:"Reiniciar", Close:"Cerrar", "Edit touch buttons":"Editar controles táctiles", "Auto":"Auto", "On":"Activado", "Off":"Desactivado", "High":"Alto", "Low":"Bajo", "Full":"Completo", "Smoother":"Más fluido", "540 lines":"540p", "720 lines":"720p", "1080 lines":"1080p", "Screen":"Pantalla", "Restart hint":"El juego se reiniciará. Las partidas se conservan, pero se pierde el progreso no guardado." }
		};
		Object.assign( oTranslations.en, {
			"Based on":"Based on", "Stored on this device":"Stored on this device",
			"Stored on this device, restart to use it":"Stored on this device, restart to use it",
			"Loaded from the server while you play. A copy on this device (about 1.7 GB) loads faster":"Loaded from the server while you play. A copy on this device (about 1.7 GB) loads faster",
			"game loads from there":"the game loads from there", "Downloading":"Downloading", "Copying":"Copying",
			"Now":"Now", "auto treats this device as slow":"auto treats this device as slow", "sound is":"sound is",
			"Delete the game data stored on this device?":"Delete the game data stored on this device?",
			"Getting the newest version needs a connection":"An internet connection is required to get the newest version.",
			"Couldn't store the data:":"Couldn't store the data:",
			"Offline: not ready, open the game again while online":"Offline: not ready. Open the game again while online.",
			"Offline: not ready, the page files aren't kept yet":"Offline: not ready. The page files haven't been cached yet.",
			"Offline: ready":"Offline: ready",
			"Offline: needs the game data (Download above)":"Offline: game data is missing (use Download above)",
			"Offline: unknown":"Offline: unknown",
		} );
		Object.assign( oTranslations.ru, {
			"Based on":"На основе", "Stored on this device":"Сохранено на этом устройстве",
			"Stored on this device, restart to use it":"Сохранено на устройстве, перезапустите игру",
			"Loaded from the server while you play. A copy on this device (about 1.7 GB) loads faster":"Загружается с сервера. Локальная копия (около 1,7 ГБ) ускорит загрузку",
			"game loads from there":"игра загружается оттуда", "Downloading":"Загрузка", "Copying":"Копирование",
			"Now":"Сейчас", "auto treats this device as slow":"автонастройка считает устройство медленным", "sound is":"звук:",
			"Delete the game data stored on this device?":"Удалить игровые данные, сохранённые на этом устройстве?",
			"Getting the newest version needs a connection":"Для загрузки последней версии требуется подключение к интернету.",
			"Couldn't store the data:":"Не удалось сохранить данные:",
			"Offline: not ready, open the game again while online":"Офлайн-режим не готов. Откройте игру ещё раз при подключении к интернету.",
			"Offline: not ready, the page files aren't kept yet":"Офлайн-режим не готов: файлы страницы ещё не сохранены.",
			"Offline: ready":"Офлайн-режим готов",
			"Offline: needs the game data (Download above)":"Для офлайн-режима нужны игровые данные (скачайте их выше).",
			"Offline: unknown":"Состояние офлайн-режима неизвестно",
		} );
		Object.assign( oTranslations.de, {
			"Based on":"Basierend auf", "Stored on this device":"Auf diesem Gerät gespeichert",
			"Stored on this device, restart to use it":"Auf diesem Gerät gespeichert; Neustart erforderlich",
			"Loaded from the server while you play. A copy on this device (about 1.7 GB) loads faster":"Wird vom Server geladen. Eine lokale Kopie (ca. 1,7 GB) lädt schneller",
			"game loads from there":"das Spiel lädt von dort", "Downloading":"Wird heruntergeladen", "Copying":"Wird kopiert",
			"Now":"Aktuell", "auto treats this device as slow":"Auto erkennt dieses Gerät als langsam", "sound is":"Ton ist",
			"Delete the game data stored on this device?":"Die auf diesem Gerät gespeicherten Spieldaten löschen?",
			"Getting the newest version needs a connection":"Zum Laden der neuesten Version ist eine Internetverbindung erforderlich.",
			"Couldn't store the data:":"Die Daten konnten nicht gespeichert werden:",
			"Offline: not ready, open the game again while online":"Offline-Modus nicht bereit. Öffne das Spiel erneut mit Internetverbindung.",
			"Offline: not ready, the page files aren't kept yet":"Offline-Modus nicht bereit: Die Seitendateien wurden noch nicht gespeichert.",
			"Offline: ready":"Offline-Modus bereit",
			"Offline: needs the game data (Download above)":"Für den Offline-Modus werden Spieldaten benötigt (oben herunterladen).",
			"Offline: unknown":"Offline-Status unbekannt",
		} );
		Object.assign( oTranslations.fr, {
			"Based on":"Basé sur", "Stored on this device":"Stocké sur cet appareil",
			"Stored on this device, restart to use it":"Stocké sur cet appareil, redémarrez pour l’utiliser",
			"Loaded from the server while you play. A copy on this device (about 1.7 GB) loads faster":"Chargé depuis le serveur. Une copie locale (environ 1,7 Go) accélère le chargement",
			"game loads from there":"le jeu se charge depuis cet emplacement", "Downloading":"Téléchargement", "Copying":"Copie",
			"Now":"Actuel", "auto treats this device as slow":"le mode auto considère cet appareil comme lent", "sound is":"le son est",
			"Delete the game data stored on this device?":"Supprimer les données du jeu enregistrées sur cet appareil ?",
			"Getting the newest version needs a connection":"Une connexion Internet est nécessaire pour obtenir la dernière version.",
			"Couldn't store the data:":"Impossible d’enregistrer les données :",
			"Offline: not ready, open the game again while online":"Mode hors ligne non prêt. Rouvrez le jeu avec une connexion Internet.",
			"Offline: not ready, the page files aren't kept yet":"Mode hors ligne non prêt : les fichiers de la page ne sont pas encore enregistrés.",
			"Offline: ready":"Mode hors ligne prêt",
			"Offline: needs the game data (Download above)":"Les données du jeu sont nécessaires pour le mode hors ligne (téléchargez-les ci-dessus).",
			"Offline: unknown":"État du mode hors ligne inconnu",
		} );
		Object.assign( oTranslations.es, {
			"Based on":"Basado en", "Stored on this device":"Guardado en este dispositivo",
			"Stored on this device, restart to use it":"Guardado en este dispositivo; reinicia para usarlo",
			"Loaded from the server while you play. A copy on this device (about 1.7 GB) loads faster":"Se carga desde el servidor. Una copia local (unos 1,7 GB) acelera la carga",
			"game loads from there":"el juego se carga desde allí", "Downloading":"Descargando", "Copying":"Copiando",
			"Now":"Ahora", "auto treats this device as slow":"el modo automático considera lento este dispositivo", "sound is":"el sonido está",
			"Delete the game data stored on this device?":"¿Eliminar los datos del juego guardados en este dispositivo?",
			"Getting the newest version needs a connection":"Se necesita conexión a Internet para obtener la última versión.",
			"Couldn't store the data:":"No se pudieron guardar los datos:",
			"Offline: not ready, open the game again while online":"El modo sin conexión no está listo. Abre el juego de nuevo con conexión a Internet.",
			"Offline: not ready, the page files aren't kept yet":"El modo sin conexión no está listo: los archivos de la página aún no se han guardado.",
			"Offline: ready":"Modo sin conexión listo",
			"Offline: needs the game data (Download above)":"Se necesitan los datos del juego para el modo sin conexión (descárgalos arriba).",
			"Offline: unknown":"Estado del modo sin conexión desconocido",
		} );

		function T( a_szText )
		{
			var oLanguage = oTranslations[ oPageSettings.oValues.szLanguage ] || oTranslations.en;
			return oLanguage[ a_szText ] || a_szText;
		}
		var oButton = document.createElement( "div" );
		oButton.id  = "settingsButton";
		oButton.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="currentColor" d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.3 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.3-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>';
		document.body.appendChild( oButton );

		var oPanel = document.createElement( "div" );
		oPanel.id  = "settings";
		oPanel.innerHTML =
			'<div class="head"><div class="title">Settings</div>' +
			'<button type="button" id="settingsClose" aria-label="Close" title="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" /></svg></button></div>' +
			'<div class="section">Display</div>' +
			'<label>Resolution <select data-key="szResolution">' +
			'<option value="auto">Auto</option><option value="540">540p</option><option value="720">720p</option>' +
			'<option value="1080">1080p</option><option value="full">Screen</option></select></label>' +
			'<label>Low latency <select data-key="szLowLatency">' +
			'<option value="auto">Auto</option><option value="on">On</option><option value="off">Off</option></select></label>' +
			'<label>Grass detail <select data-key="szGrass">' +
			'<option value="auto">Auto</option><option value="high">High</option><option value="low">Low</option></select></label>' +
			'<label>Draw distance <select data-key="szDrawDistance">' +
			'<option value="auto">Auto</option><option value="100">Full</option><option value="75">75%</option><option value="50">50%</option></select></label>' +
			'<label>FPS limit <select data-key="szFrameLimit">' +
			'<option value="0">Off</option><option value="60">60</option><option value="45">45</option><option value="30">30</option><option value="20">20</option></select></label>' +
			'<label>Sound <select data-key="szSound">' +
			'<option value="auto">Auto</option><option value="smooth">Smoother</option></select></label>' +
			'<label>Show FPS <input type="checkbox" data-key="bShowFps"></label>' +
			'<div class="section">Languages</div>' +
			'<label>Interface language <select data-key="szLanguage"><option value="en">English</option><option value="ru">Русский</option><option value="de">Deutsch</option><option value="fr">Français</option><option value="es">Español</option></select></label>' +
			'<div class="hint" id="settingsAuto"></div>' +
			'<div class="buttons" id="settingsTouchRow"><button id="settingsTouchLayout">Edit touch buttons</button></div>' +
			'<div class="section">Cheats</div>' +
			'<div class="row"><input type="text" id="settingsCheat" placeholder="Cheat code" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>' +
			'<div class="section" id="settingsDataSection">Game data</div>' +
			'<div class="data-panel">' +
				'<div class="data-panel-status hint" id="settingsDataText"></div>' +
				'<div class="buttons data-panel-actions" id="settingsDataButtons"><button id="settingsDataDownload" class="accent">Download</button><button id="settingsDataFolder">From folder</button>' +
				'<button id="settingsDataDelete">Delete</button><input type="file" id="settingsDataInput" hidden><input type="file" id="settingsDataFolderInput" webkitdirectory multiple hidden></div>' +
			'</div>' +
			'<div class="data-panel data-panel-details"><div class="data-panel-caption">STATUS</div><div class="hint" id="settingsAbout"></div></div>' +
			'<div class="data-panel data-panel-maintenance">' +
				'<div class="data-maintenance-update"><div class="data-panel-caption">CLIENT</div><div class="buttons" id="settingsUpdateButtons"><button id="settingsUpdate">Update client</button></div><div class="hint" id="settingsUpdateHint">Clear cached site files and reload the latest version.</div></div>' +
				'<div class="data-maintenance-restart"><div class="data-panel-caption">GAME</div><div class="hint" id="settingsRestartHint">Restarts the game. Saves are kept, progress since the last save is lost.</div>' +
				'<div class="buttons"><button id="settingsRestart" class="accent">Restart</button></div></div>' +
			'</div>';
		document.body.appendChild( oPanel );

		// Arrange settings like a compact Spotify-style desktop: left navigation, clean content area.
		var oHead = oPanel.querySelector( ".head" );
		var oSections = [];
		var oCurrent = null;
		var oNode = oHead.nextElementSibling;

		while ( oNode )
		{
			var oNext = oNode.nextElementSibling;

			if ( oNode.classList.contains( "section" ) )
			{
				oCurrent = document.createElement( "section" );
				oCurrent.className = "settings-group";
				oCurrent.dataset.name = oNode.textContent.trim().toLowerCase();
				oSections.push( oCurrent );
			}

			if ( oCurrent )
				oCurrent.appendChild( oNode );

			oNode = oNext;
		}

		var oLayout = document.createElement( "div" );
		oLayout.className = "settings-layout";
		var oNav = document.createElement( "nav" );
		oNav.className = "settings-nav";
		oNav.innerHTML = '<div class="settings-nav-title">Barnyard</div>';
		var oContent = document.createElement( "div" );
		oContent.className = "settings-content";
		oContent.appendChild( oHead );

		for ( var iSection = 0; iSection < oSections.length; iSection++ )
		{
			var oGroup = oSections[ iSection ];
			var szGroup = oGroup.dataset.name;
			var oNavButton = document.createElement( "button" );
			oNavButton.type = "button";
			oNavButton.className = "settings-nav-item";
			oNavButton.textContent = oGroup.querySelector( ".section" ).textContent.trim();
			oNavButton.dataset.target = szGroup;
			oNav.appendChild( oNavButton );
			oContent.appendChild( oGroup );

			oNavButton.addEventListener( "click", function () {
				for ( var oItem of oNav.querySelectorAll( ".settings-nav-item" ) )
					oItem.classList.toggle( "active", oItem == this );

				for ( var oPage of oSections )
				{
					var bSelected = oPage.dataset.name == this.dataset.target;
					oPage.style.display = bSelected ? "block" : "none";
					if ( bSelected )
					{
						oPage.classList.remove( "settings-page-enter" );
						void oPage.offsetWidth;
						oPage.classList.add( "settings-page-enter" );
					}
				}
				oContent.scrollTop = 0;
			} );
		}

		oNav.querySelector( ".settings-nav-item" ).classList.add( "active" );
		for ( var iPage = 0; iPage < oSections.length; iPage++ )
			oSections[ iPage ].style.display = iPage == 0 ? "block" : "none";
		oLayout.appendChild( oNav );
		oLayout.appendChild( oContent );
		oPanel.appendChild( oLayout );

		var oStarted = {
			szResolution : oPageSettings.oValues.szResolution,
			szLowLatency : oPageSettings.oValues.szLowLatency,
			szGrass : oPageSettings.oValues.szGrass,
			szDrawDistance : oPageSettings.oValues.szDrawDistance,
			szSound : oPageSettings.oValues.szSound
		};

		// The stored data pack: bStored is what's in storage now, the game uses what was there at the start
		var oData = { bStored : false, bChanged : false, szBusy : "" };

		function ApplyLanguage()
		{
			var oTitle = oPanel.querySelector( ".head .title" );
			if ( oTitle ) oTitle.textContent = T( "Settings" );
			var oLabels = { szResolution:"Resolution", szLowLatency:"Low latency", szGrass:"Grass detail", szDrawDistance:"Draw distance", szFrameLimit:"FPS limit", szSound:"Sound", bShowFps:"Show FPS", szLanguage:"Interface language" };
			for ( var oLabel of oPanel.querySelectorAll( "label" ) )
			{
				var oControl = oLabel.querySelector( "select, input[data-key]" );
				if ( oControl && oLabels[ oControl.dataset.key ] && oLabel.firstChild )
					oLabel.firstChild.nodeValue = T( oLabels[ oControl.dataset.key ] ) + " ";
			}
			for ( var oGroup of oPanel.querySelectorAll( ".settings-group" ) )
			{
				var oHeading = oGroup.querySelector( ".section" );
				if ( oHeading )
					oHeading.textContent = T( oGroup.dataset.name.charAt( 0 ).toUpperCase() + oGroup.dataset.name.slice( 1 ) );
			}
			for ( var oNavItem of oNav.querySelectorAll( ".settings-nav-item" ) )
				oNavItem.textContent = T( oNavItem.dataset.target.charAt( 0 ).toUpperCase() + oNavItem.dataset.target.slice( 1 ) );
			var oClose = document.getElementById( "settingsClose" );
			if ( oClose )
			{
				oClose.setAttribute( "aria-label", T( "Close" ) );
				oClose.title = T( "Close" );
				oClose.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" /></svg>';
			}
			var oNavTitle = oNav.querySelector( ".settings-nav-title" );
			if ( oNavTitle ) oNavTitle.textContent = "Barnyard";

			var oWelcomeText = {
				en : [ "Welcome!", "To start playing, install the game data. It will be saved on this device and won’t need to be downloaded again.", "Install game data", "Settings", "Choose Data folder", "Game data is not installed" ],
				ru : [ "Добро пожаловать!", "Чтобы начать игру, установите игровые данные. Они сохранятся на этом устройстве и не потребуют повторной загрузки.", "Установить игровые данные", "Настройки", "Выбрать папку Data", "Игровые данные не установлены" ],
				de : [ "Willkommen!", "Installiere die Spieldaten, um zu beginnen. Sie werden auf diesem Gerät gespeichert und müssen nicht erneut heruntergeladen werden.", "Spieldaten installieren", "Einstellungen", "Data-Ordner auswählen", "Spieldaten sind nicht installiert" ],
				fr : [ "Bienvenue !", "Pour commencer, installez les données du jeu. Elles seront enregistrées sur cet appareil et n’auront pas besoin d’être téléchargées à nouveau.", "Installer les données du jeu", "Paramètres", "Choisir le dossier Data", "Les données du jeu ne sont pas installées" ],
				es : [ "¡Bienvenido!", "Para empezar, instala los datos del juego. Se guardarán en este dispositivo y no tendrás que descargarlos de nuevo.", "Instalar datos del juego", "Ajustes", "Elegir carpeta Data", "Los datos del juego no están instalados" ]
			};
			var aWelcomeText = oWelcomeText[ oPageSettings.oValues.szLanguage ] || oWelcomeText.en;
			var aWelcomeIds = [ "welcomeDescription", "welcomeDownload", "welcomeSettings", "welcomeFolder" ];
			for ( var iWelcome = 0; iWelcome < aWelcomeIds.length; iWelcome++ )
			{
				var oWelcomeElement = document.getElementById( aWelcomeIds[ iWelcome ] );
				if ( oWelcomeElement )
					oWelcomeElement.textContent = aWelcomeText[ iWelcome + 1 ];
			}
			var oCheat = document.getElementById( "settingsCheat" );
			if ( oCheat ) oCheat.placeholder = T( "Cheat code" );
			var aButtons = { settingsDataDownload:"Download", settingsDataFolder:"From folder", settingsDataDelete:"Delete", settingsUpdate:"Update client", settingsRestart:"Restart", settingsTouchLayout:"Edit touch buttons" };
			for ( var szId in aButtons )
			{
				var oButtonText = document.getElementById( szId );
				if ( oButtonText ) oButtonText.textContent = T( aButtons[ szId ] );
			}
			document.getElementById( "settingsRestartHint" ).textContent = T( "Restart hint" );
			document.getElementById( "settingsUpdateHint" ).textContent = T( "Update client hint" );
			for ( var oSelect of oPanel.querySelectorAll( "select" ) )
			{
				if ( oSelect.dataset.key == "szLanguage" ) continue;
				for ( var oOption of oSelect.options )
				{
					if ( !oOption.dataset.original ) oOption.dataset.original = oOption.textContent;
					oOption.textContent = T( oOption.dataset.original );
				}
				var oWrap = oSelect.parentNode;
				if ( oWrap.classList.contains( "custom-select" ) )
				{
					var aOptionButtons = oWrap.querySelectorAll( ".custom-select-option" );
					for ( var i = 0; i < aOptionButtons.length; i++ ) aOptionButtons[ i ].textContent = oSelect.options[ i ].textContent;
					var oTrigger = oWrap.querySelector( ".custom-select-trigger" );
					if ( oTrigger ) oTrigger.textContent = oSelect.options[ oSelect.selectedIndex ].textContent;
				}
			}
		}

		function UpdateData()
		{
			var bSupported = oDataPack.IsSupported();
			document.getElementById( "settingsDataSection" ).style.display = bSupported ? "" : "none";
			document.getElementById( "settingsDataText" ).style.display    = bSupported ? "" : "none";
			document.getElementById( "settingsDataButtons" ).style.display = bSupported ? "" : "none";

			// The stored pack is found after the panel is made
			oData.bStored = oData.bStored || !!oDataPack.oPack;

			var szText;

			if ( oData.szBusy )
				szText = oData.szBusy;
			else if ( oData.bStored && oDataPack.oPack )
				szText = T( "Stored on this device" ) + " (" + ( oDataPack.oPack.oFile.size / 1073741824 ).toFixed( 1 ) + " GB), " + T( "game loads from there" );
			else if ( oData.bStored )
				szText = T( "Stored on this device, restart to use it" );
			else
				szText = T( "Loaded from the server while you play. A copy on this device (about 1.7 GB) loads faster" );

			document.getElementById( "settingsDataText" ).textContent = szText;

			var bBusy = !!oDataPack.oWorker;
			var oWelcome = document.getElementById( "dataWelcome" );
			var oWelcomeStatus = document.getElementById( "welcomeStatus" );
			var oWelcomeDownload = document.getElementById( "welcomeDownload" );
			var oWelcomeProgress = document.getElementById( "welcomeProgress" );
			var oWelcomeProgressBar = document.getElementById( "welcomeProgressBar" );
			if ( oWelcome && !oDataPack.oPack )
			{
				oWelcome.style.display = oData.bStored ? "none" : "flex";
				if ( oWelcomeStatus )
					oWelcomeStatus.textContent = oData.szBusy || ( oData.bStored ? T( "Stored on this device, restart to use it" ) : T( "Game data is not installed" ) );
				if ( oWelcomeProgress )
				{
					oWelcomeProgress.hidden = !bBusy;
					oWelcomeProgress.classList.toggle( "is-indeterminate", bBusy && oData.fProgress < 0 );
				}
				if ( oWelcomeProgressBar && bBusy && oData.fProgress >= 0 )
					oWelcomeProgressBar.style.width = Math.floor( oData.fProgress * 100 ) + "%";
				if ( oWelcomeStatus && bBusy && oData.fProgress >= 0 )
					oWelcomeStatus.textContent = ( oData.szBusyVerb || T( "Downloading" ) ) + " — " + Math.floor( oData.fProgress * 100 ) + "%";
				if ( oWelcomeDownload )
				{
					oWelcomeDownload.disabled = bBusy;
					oWelcomeDownload.classList.toggle( "is-loading", bBusy );
					oWelcomeDownload.textContent = bBusy ? ( oData.fProgress >= 0 ? Math.floor( oData.fProgress * 100 ) + "%" : ( oData.szBusy || T( "Downloading..." ) ) ) : T( "Install game data" );
				}
			}
			document.getElementById( "settingsDataDownload" ).style.display = oData.bStored ? "none" : "";
			document.getElementById( "settingsDataFolder" ).style.display   = oData.bStored ? "none" : "";
			document.getElementById( "settingsDataDelete" ).style.display   = oData.bStored ? "" : "none";

			for ( var szId of [ "settingsDataDownload", "settingsDataFolder", "settingsDataDelete" ] )
			{
				var oButton = document.getElementById( szId );
				oButton.disabled = bBusy;
				oButton.classList.toggle( "is-loading", bBusy && szId != "settingsDataDelete" );
			}
		}

		function StoreData( a_oMessage, a_szVerb )
		{
			oData.szBusy = T( a_szVerb ) + "...";
			oData.szBusyVerb = T( a_szVerb );
			oData.fProgress = -1;
			UpdatePanel();

			oDataPack.Store( a_oMessage, function ( a_fProgress, a_iWritten ) {
				oData.fProgress = a_fProgress;
				oData.szBusy = a_fProgress >= 0 ? T( a_szVerb ) + " " + Math.floor( a_fProgress * 100 ) + "%" : T( a_szVerb ) + ", " + Math.round( a_iWritten / 1048576 ) + " MB";
				UpdatePanel();
			} ).then( function () {
				oData.szBusy   = "";
				oData.fProgress = 1;
				oData.bStored  = true;
				oData.bChanged = true;

				// On the first-run welcome screen, restart automatically after the pack is safely stored.
				var oWelcome = document.getElementById( "dataWelcome" );
				if ( oWelcome && oWelcome.style.display == "flex" )
				{
					location.reload();
					return;
				}

				UpdatePanel();
			} ).catch( function ( a_oError ) {
				oData.szBusy = T( "Couldn't store the data:" ) + " " + a_oError.message;
				UpdatePanel();
			} );
		}

		// The page's date shows whether an installed app got the newest files
		function UpdateAbout()
		{
			var szText = T( "Page from" ) + " " + document.lastModified;
			var oContext = Module.oAudioContext;

			if ( oContext )
				szText += ". " + T( "Sound" ) + " " + oContext.sampleRate + " Hz, " + Math.round( ( Module.iAudioLag || 0 ) * 1000 / 44100 ) + " ms " + T( "in the buffer (worst" ) + " " +
					Math.round( ( Module.iAudioWorst || 0 ) * 1000 / 44100 ) + " ms, " + T( "target" ) + " " + ( Module._WASM_GetAudioLead ? Math.round( Module._WASM_GetAudioLead() * 1000 / 44100 ) : 46 ) + " ms), " + Math.round( ( ( oContext.baseLatency || 0 ) + ( oContext.outputLatency || 0 ) ) * 1000 ) + " ms " + T( "output" ) + ", " +
					( Module.iAudioGaps || 0 ) + " " + T( "gaps" ) + ", " + ( Module.iAudioSkips || 0 ) + " " + T( "skips" ) +
					( Module._WASM_GetAudioWorstStart ? ", " + T( "sounds start within" ) + " " + Math.round( Module._WASM_GetAudioWorstStart() ) + " ms" : "" );

			// How long the game waited for its files at worst, a slow connection or storage shows here
			if ( Module._WASM_GetFileWorstReadMs )
				szText += ". " + T( "Files from" ) + " " + T( oDataPack.oPack ? "this device" : "the server" ) + ", " + T( "slowest read" ) + " " + Math.round( Module._WASM_GetFileWorstReadMs() ) + " ms";

			document.getElementById( "settingsAbout" ).textContent = szText;
			document.getElementById( "settingsUpdateButtons" ).style.display = navigator.serviceWorker && !/[?&]app(&|$)/.test( location.search ) ? "" : "none";

			// Offline starts need the service worker running this page, the page files it keeps and the stored data
			if ( navigator.serviceWorker && window.caches && !/[?&]app(&|$)/.test( location.search ) )
			{
				GetOfflineState().then( function ( a_szState ) {
					document.getElementById( "settingsAbout" ).textContent = szText + ". " + a_szState;
				} );
			}
		}

		async function GetOfflineState()
		{
			try
			{
				if ( !navigator.serviceWorker.controller )
					return T( "Offline: not ready, open the game again while online" );

				var iKept = 0;

				for ( var szName of await caches.keys() )
				{
					if ( szName.indexOf( "barnyard-" ) == 0 && await ( await caches.open( szName ) ).match( new URL( "OpenBarnyard.wasm", location.href ).href ) )
						iKept++;
				}

				if ( !iKept )
					return T( "Offline: not ready, the page files aren't kept yet" );

				return oData.bStored ? T( "Offline: ready" ) : T( "Offline: needs the game data (Download above)" );
			}
			catch ( e )
			{
				return T( "Offline: unknown" ) + " (" + e.message + ")";
			}
		}

		function UpdatePanel()
		{
			document.getElementById( "settingsTouchRow" ).style.display = document.getElementById( "touch" ) ? "" : "none";
			UpdateData();
			UpdateAbout();
			ApplyLanguage();

			var bRestart = oStarted.szResolution != oPageSettings.oValues.szResolution || oStarted.szLowLatency != oPageSettings.oValues.szLowLatency || oStarted.szGrass != oPageSettings.oValues.szGrass || oStarted.szDrawDistance != oPageSettings.oValues.szDrawDistance || oStarted.szSound != oPageSettings.oValues.szSound || oData.bChanged;

			document.getElementById( "settingsRestart" ).style.display     = bRestart ? "" : "none";
			document.getElementById( "settingsRestartHint" ).style.display = bRestart ? "" : "none";
			document.querySelector( "#settings .data-maintenance-restart" ).style.display = bRestart ? "" : "none";
			document.querySelector( "#settings .data-panel-maintenance" ).style.gridTemplateColumns = bRestart ? "" : "minmax(0, 1fr)";
			document.getElementById( "settingsAuto" ).textContent = T( "Now" ) + " " + Module.oCanvas.width + "x" + Module.oCanvas.height + ( oPageSettings.IsSlowDevice() ? ", " + T( "auto treats this device as slow" ) : "" ) +
				( Module.oAudioContext && Module.oAudioContext.state != "running" ? ", " + T( "sound is" ) + " " + Module.oAudioContext.state : "" );
		}

		for ( var oControl of oPanel.querySelectorAll( "[data-key]" ) )
		{
			var szKey = oControl.dataset.key;

			if ( oControl.type == "checkbox" )
				oControl.checked = oPageSettings.oValues[ szKey ];
			else
				oControl.value = oPageSettings.oValues[ szKey ];

			oControl.addEventListener( "change", function ( a_oEvent ) {
				var oTarget = a_oEvent.target;
				oPageSettings.oValues[ oTarget.dataset.key ] = oTarget.type == "checkbox" ? oTarget.checked : oTarget.value;

				if ( oTarget.dataset.key == "szResolution" && oTarget.value == "auto" )
					oPageSettings.oValues.bSlowDevice = false;

				oPageSettings.Save();
				oPageSettings.ShowFps( oPageSettings.oValues.bShowFps );
				oPageSettings.ApplyFrameLimit();
				UpdatePanel();
			} );

			if ( oControl.tagName == "SELECT" )
			{
				( function ( oSelect ) {
					var oWrap = document.createElement( "div" );
					oWrap.className = "custom-select";
					oSelect.parentNode.insertBefore( oWrap, oSelect );
					oWrap.appendChild( oSelect );
					oSelect.classList.add( "native-select-hidden" );

					var oTrigger = document.createElement( "button" );
					oTrigger.type = "button";
					oTrigger.className = "custom-select-trigger";
					oTrigger.setAttribute( "aria-haspopup", "listbox" );
					oTrigger.setAttribute( "aria-expanded", "false" );
					oWrap.appendChild( oTrigger );

					var oMenu = document.createElement( "div" );
					oMenu.className = "custom-select-menu";
					oMenu.setAttribute( "role", "listbox" );
					oWrap.appendChild( oMenu );

					function Sync()
					{
						var oSelected = oSelect.options[ oSelect.selectedIndex ];
						oTrigger.textContent = oSelected ? oSelected.textContent : "";
						for ( var oButton of oMenu.children )
						{
							var bSelected = oButton.dataset.value == oSelect.value;
							oButton.classList.toggle( "selected", bSelected );
							oButton.setAttribute( "aria-selected", bSelected ? "true" : "false" );
						}
					}

					for ( var oOption of oSelect.options )
					{
						var oOptionButton = document.createElement( "button" );
						oOptionButton.type = "button";
						oOptionButton.className = "custom-select-option";
						oOptionButton.textContent = oOption.textContent;
						oOptionButton.dataset.value = oOption.value;
						oOptionButton.setAttribute( "role", "option" );
						oOptionButton.disabled = oOption.disabled;
						oOptionButton.addEventListener( "click", function () {
							oSelect.value = this.dataset.value;
							oSelect.dispatchEvent( new Event( "change", { bubbles : true } ) );
							oWrap.classList.remove( "open" );
							oTrigger.setAttribute( "aria-expanded", "false" );
							oTrigger.focus();
						} );
						oMenu.appendChild( oOptionButton );
					}

					oTrigger.addEventListener( "click", function () {
						var bOpen = oWrap.classList.toggle( "open" );
						oTrigger.setAttribute( "aria-expanded", bOpen ? "true" : "false" );
					} );

					document.addEventListener( "pointerdown", function ( a_oEvent ) {
						if ( !oWrap.contains( a_oEvent.target ) )
						{
							oWrap.classList.remove( "open" );
							oTrigger.setAttribute( "aria-expanded", "false" );
						}
					} );

					oTrigger.addEventListener( "keydown", function ( a_oEvent ) {
						if ( a_oEvent.key == "ArrowDown" || a_oEvent.key == "Enter" || a_oEvent.key == " " )
						{
							a_oEvent.preventDefault();
							oWrap.classList.add( "open" );
							oTrigger.setAttribute( "aria-expanded", "true" );
							var oCurrent = oMenu.querySelector( ".selected" );
							( oCurrent || oMenu.firstElementChild ).focus();
						}
						else if ( a_oEvent.key == "Escape" )
						{
							oWrap.classList.remove( "open" );
							oTrigger.setAttribute( "aria-expanded", "false" );
						}
					} );

					oMenu.addEventListener( "keydown", function ( a_oEvent ) {
						var aItems = Array.from( oMenu.querySelectorAll( "button:not(:disabled)" ) );
						var iIndex = aItems.indexOf( document.activeElement );
						if ( a_oEvent.key == "ArrowDown" || a_oEvent.key == "ArrowUp" )
						{
							a_oEvent.preventDefault();
							aItems[ ( iIndex + ( a_oEvent.key == "ArrowDown" ? 1 : -1 ) + aItems.length ) % aItems.length ].focus();
						}
						else if ( a_oEvent.key == "Escape" )
						{
							oWrap.classList.remove( "open" );
							oTrigger.setAttribute( "aria-expanded", "false" );
							oTrigger.focus();
						}
					} );

					oSelect.addEventListener( "change", Sync );
					Sync();
				} )( oControl );
			}
		}

		function OpenSettingsPanel()
		{
			UpdatePanel();
			oPanel.style.display = "block";
			requestAnimationFrame( function () { oPanel.classList.add( "settings-panel-open" ); } );
			var oFirstPage = oNav.querySelector( ".settings-nav-item" );
			if ( oFirstPage ) oFirstPage.click();
		}

		function CloseSettingsPanel()
		{
			oPanel.classList.remove( "settings-panel-open" );
		}

		oButton.addEventListener( "click", function () {
			if ( document.pointerLockElement )
				document.exitPointerLock();
			if ( oPanel.style.display == "block" )
				CloseSettingsPanel();
			else
				OpenSettingsPanel();
		} );

		oPanel.addEventListener( "transitionend", function ( a_oEvent ) {
			if ( a_oEvent.target == oPanel && a_oEvent.propertyName == "opacity" && !oPanel.classList.contains( "settings-panel-open" ) )
				oPanel.style.display = "none";
		} );

		document.getElementById( "settingsClose" ).addEventListener( "click", CloseSettingsPanel );

		document.getElementById( "settingsRestart" ).addEventListener( "click", function () {
			location.reload();
		} );

		document.getElementById( "settingsDataDownload" ).addEventListener( "click", function () {
			StoreData( { szUrl : oDataPack.GetPackUrl() }, "Downloading" );
		} );

		document.getElementById( "welcomeSettings" ).addEventListener( "click", function () {
			if ( document.pointerLockElement )
				document.exitPointerLock();
			OpenSettingsPanel();
		} );

		document.getElementById( "welcomeDownload" ).addEventListener( "click", function () {
			document.getElementById( "settingsDataDownload" ).click();
		} );
		document.getElementById( "welcomeFolder" ).addEventListener( "click", function () {
			document.getElementById( "settingsDataFolder" ).click();
		} );

		document.getElementById( "settingsDataFolder" ).addEventListener( "click", function () {
			document.getElementById( "settingsDataFolderInput" ).click();
		} );

		// A .tar or .tar.gz of the Data folder
		document.getElementById( "settingsDataInput" ).addEventListener( "change", function ( a_oEvent ) {
			var oFile = a_oEvent.target.files[ 0 ];
			a_oEvent.target.value = "";

			if ( oFile )
				StoreData( { oFile : oFile }, "Copying" );
		} );

		// Chromium browsers preserve each file's path when a directory is selected.
		// The worker keeps Data/ and its descendants, whether the user picked Data itself or the game folder.
		document.getElementById( "settingsDataFolderInput" ).addEventListener( "change", function ( a_oEvent ) {
			var aFiles = Array.from( a_oEvent.target.files );
			a_oEvent.target.value = "";

			if ( aFiles.length )
				StoreData( { aFiles : aFiles }, "Copying" );
		} );

		// The running game reads the stored copy, so it restarts right away
		document.getElementById( "settingsDataDelete" ).addEventListener( "click", function () {
			if ( !confirm( T( "Delete the game data stored on this device?" ) ) )
				return;

			oDataPack.Store( { bDelete : true }, function () {} ).then( function () {
				location.reload();
			} ).catch( function ( a_oError ) {
				oData.szBusy = "Couldn't delete the data: " + a_oError.message;
				UpdatePanel();
			} );
		} );

		// Drops the kept page files (not the game data) and loads them again from the server
		document.getElementById( "settingsUpdate" ).addEventListener( "click", async function () {
			if ( !navigator.onLine )
			{
				document.getElementById( "settingsAbout" ).textContent = T( "Getting the newest version needs a connection" );
				return;
			}

			try
			{
				for ( var oRegistration of await navigator.serviceWorker.getRegistrations() )
					await oRegistration.unregister();

				for ( var szName of await caches.keys() )
				{
					if ( szName.indexOf( "barnyard-" ) == 0 )
						await caches.delete( szName );
				}
			}
			catch ( e )
			{
			}

			location.reload();
		} );

		document.getElementById( "settingsTouchLayout" ).addEventListener( "click", function () {
			oPanel.style.display = "none";
			oGameInput.EditTouchLayout();
		} );

		// Enter submits the cheat code directly from the input field
		var oCheatInput = document.getElementById( "settingsCheat" );

		// The game listens on the window in the capture phase, typing in the panel isn't game input
		for ( var szEvent of [ "keydown", "keyup", "keypress" ] )
		{
			window.addEventListener( szEvent, function ( a_oEvent ) {
				if ( !a_oEvent.isTrusted || !oPanel.contains( a_oEvent.target ) )
					return;

				if ( a_oEvent.type == "keydown" && a_oEvent.key == "Enter" && a_oEvent.target == oCheatInput )
				{
					a_oEvent.preventDefault();
					oCheatInput.blur();
					oPanel.style.display = "none";
					oPageSettings.EnterCheatCode( oCheatInput.value );
					oCheatInput.value = "";
				}

				a_oEvent.stopImmediatePropagation();
			}, true );
			ApplyLanguage();
		}
	}
};

oPageSettings.Load();
oPageSettings.CreatePanel();
