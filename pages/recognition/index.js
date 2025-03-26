// pages/recognition/index.js
const API_KEY = '7c2c647a-ab11-4d50-8698-e23b18dab5d1';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

Page({

  /**
   * Page initial data
   */
  data: {
    tempImagePath: '',
    recognitionResult: '',
    isProcessing: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {

  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          tempImagePath: res.tempFiles[0].tempFilePath,
          recognitionResult: ''
        });
      }
    });
  },

  // 识别图片
  async recognizeImage() {
    if (!this.data.tempImagePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({ isProcessing: true });

    try {
      // 读取图片文件并转换为base64
      const fileContent = wx.getFileSystemManager().readFileSync(this.data.tempImagePath, 'base64');
      
      // 获取图片格式
      const imageFormat = this.getImageFormat(this.data.tempImagePath);
      const base64Image = `data:image/${imageFormat};base64,${fileContent}`;

      // 准备请求数据
      const requestData = {
        model: "ep-20250326211059-xbpdt",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "识别图片"
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ]
      };

      // 调用API
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: API_URL,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          data: requestData,
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200 && res.data) {
        // 提取API返回的识别结果
        const result = res.data.choices[0]?.message?.content || '无法识别图片内容';
        this.setData({
          recognitionResult: result
        });
      } else {
        throw new Error(res.data?.error?.message || '识别失败');
      }
    } catch (err) {
      console.error('识别失败：', err);
      this.handleError(err.message || '识别失败');
    } finally {
      this.setData({ isProcessing: false });
    }
  },

  // 获取图片格式
  getImageFormat(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'png':
        return 'png';
      case 'webp':
        return 'webp';
      default:
        return 'jpeg'; // 默认使用jpeg
    }
  },

  // 统一错误处理
  handleError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
    this.setData({
      recognitionResult: ''
    });
  },

  // 重新选择
  resetImage() {
    this.setData({
      tempImagePath: '',
      recognitionResult: '',
      isProcessing: false
    });
  }
})