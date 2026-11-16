// Checks for a newer BarnyardWeb client and lets the player reload at a safe moment.
(function () {
	if (!("serviceWorker" in navigator) || !window.isSecureContext || /[?&]app(&|$)/.test(location.search))
		return;

	var oBanner;
	var bReloading = false;

	function ShowUpdate() {
		if (oBanner || !document.body)
			return;

		oBanner = document.createElement("div");
		oBanner.id = "clientUpdateNotice";
		oBanner.setAttribute("role", "status");
		oBanner.innerHTML = '<span>A new version of BarnyardWeb is ready.</span><button type="button">Reload to update</button>';
		document.body.appendChild(oBanner);

		oBanner.querySelector("button").addEventListener("click", function () {
			var oWaiting = window.oBarnyardWaitingWorker;
			if (!oWaiting)
				return;

			bReloading = true;
			this.disabled = true;
			this.textContent = "Updating…";
			oWaiting.postMessage({ type: "SKIP_WAITING" });
			setTimeout(function () {
				if (bReloading)
					location.reload();
			}, 5000);
		});
	}

	function WatchRegistration(oRegistration) {
		function CheckWaiting() {
			if (oRegistration.waiting && navigator.serviceWorker.controller) {
				window.oBarnyardWaitingWorker = oRegistration.waiting;
				ShowUpdate();
			}
		}

		CheckWaiting();
		oRegistration.addEventListener("updatefound", function () {
			var oInstalling = oRegistration.installing;
			if (!oInstalling)
				return;

			oInstalling.addEventListener("statechange", function () {
				if (oInstalling.state == "installed" && navigator.serviceWorker.controller) {
					window.oBarnyardWaitingWorker = oRegistration.waiting || oInstalling;
					ShowUpdate();
				}
			});
		});
	}

	navigator.serviceWorker.addEventListener("controllerchange", function () {
		if (!bReloading)
			return;
		bReloading = false;
		location.reload();
	});

	navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (oRegistration) {
		WatchRegistration(oRegistration);
		oRegistration.update();
		// Recheck periodically while the game is open; also check when the tab becomes visible again.
		setInterval(function () {
			if (document.visibilityState == "visible")
				oRegistration.update().catch(function () {});
		}, 5 * 60 * 1000);
		document.addEventListener("visibilitychange", function () {
			if (document.visibilityState == "visible")
				oRegistration.update().catch(function () {});
		});
	}).catch(function (oError) {
		console.warn("BarnyardWeb update check failed:", oError);
	});
})();
