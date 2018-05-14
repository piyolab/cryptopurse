var QRCodeReader = /** @class */ (function () {
    function QRCodeReader(jsQR, video, canvas) {
        var _this = this;
        this.readingQRCode = false;
        this.isStarted = false;
        this.start = function (onStarted, onError) {
            _this.onStarted = onStarted;
            var this_ = _this;
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
                this_.video.srcObject = stream;
                this_.video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                this_.video.play();
                this_.readingQRCode = true;
                this_.isStarted = false;
                requestAnimationFrame(this_.tick);
            })["catch"](function (e) {
                console.error(e.stack);
                onError(e);
            });
        };
        this.stop = function () {
            if (_this.video.srcObject != null) {
                _this.readingQRCode = false;
                _this.video.srcObject.getTracks()[0].stop();
            }
        };
        this.tick = function () {
            if (_this.video.readyState === _this.video.HAVE_ENOUGH_DATA) {
                if (!_this.isStarted) {
                    _this.isStarted = true;
                    _this.onStarted();
                }
                _this.onPreview(_this.video);
                var imageData = _this.canvas.getImageData(0, 0, _this.video.videoHeight, _this.video.videoWidth);
                var code = _this.jsQR(imageData.data, imageData.width, imageData.height);
                if (code != null && _this.readingQRCode) {
                    _this.onData(code.data);
                }
            }
            if (_this.readingQRCode) {
                requestAnimationFrame(_this.tick);
            }
        };
        this.jsQR = jsQR;
        this.video = video;
        this.canvas = canvas;
    }
    return QRCodeReader;
}());
