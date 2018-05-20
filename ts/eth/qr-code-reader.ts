class QRCodeReader {
  public onPreview: (video: any) => void
  public onData: (data: string) => void
  public jsQR: (data: any, width: number, height: number) => any

  private readingQRCode: boolean = false;
  private video: any
  private canvas: any
  private onStarted: () => void
  private isStarted: boolean = false;

  constructor(jsQR: any, video: any, canvas: any) {
    this.jsQR = jsQR
    this.video = video
    this.canvas = canvas
  }

  public start = (onStarted: () => void, onError: (error) => void) => {
    this.onStarted = onStarted
    const this_ = this
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((stream) => {
      this_.video.srcObject = stream;
      this_.video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      this_.video.play();
      this_.readingQRCode = true;
      this_.isStarted = false;
      requestAnimationFrame(this_.tick);
    }).catch((e) => {
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

      const imageData = this.canvas.getImageData(0, 0, this.video.videoHeight, this.video.videoWidth);
      const code = this.jsQR(imageData.data, imageData.width, imageData.height);
      if (code != null && this.readingQRCode) {
        this.onData(code.data)
      }
    }
    if (this.readingQRCode) {
      requestAnimationFrame(this.tick);
    }
  }
}
