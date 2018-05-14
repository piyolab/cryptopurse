class QRCodeReader {
  private readingQRCode: boolean = false;
  private video: any
  private canvas: any
  private onStarted: () => void
  public onPreview: (video: any) => void
  public onData: (data: string) => void
  private isStarted: boolean = false;

  constructor(video: any, canvas: any) {
    this.video = video
    this.canvas = canvas
  }

  public start = (onStarted: () => void, onError: (error) => void) => {
    this.onStarted = onStarted
    const this_ = this
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
      this_.video.srcObject = stream;
      this_.video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      this_.video.play();
      this_.readingQRCode = true;
      this_.isStarted = false;
      requestAnimationFrame(this_.tick);
    }).catch(function(e) {
      console.error(e.stack)
      onError(e)
    });
  }

  public stop = () => {
    if (this.video.srcObject != null) {
      this.readingQRCode = false;
      this.video.srcObject.getTracks()[0].stop();
    }
  }

  private tick = () => {
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      if (!this.isStarted) {
        this.isStarted = true;
        this.onStarted()
      }
      this.onPreview(this.video)

      var imageData = this.canvas.getImageData(0, 0, this.video.videoHeight, this.video.videoWidth);
      var code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code != null && this.readingQRCode) {
        this.onData(code.data)
      }
    }
    if (this.readingQRCode) {
      requestAnimationFrame(this.tick);
    }
  }
}
