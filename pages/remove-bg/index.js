// pages/remove-bg/index.js
const API_KEY = '6HjqPvQ5kxrzK7QPPNRj6FLC';
const API_URL = 'https://api.remove.bg/v1.0/removebg';

Page({

  /**
   * Page initial data
   */
  data: {
    tempImagePath: '',
    resultImagePath: '',
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
          resultImagePath: ''
        });
      }
    });
  },

  // 去除背景
  async removeBg() {
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

      // 调用remove.bg API
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: API_URL,
          method: 'POST',
          header: {
            'X-Api-Key': API_KEY,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          data: {
            image_file_b64: fileContent,
            size: 'auto',
            format: 'png'
          },
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode === 200 && res.data) {
        // 将返回的图片数据保存为临时文件
        const tempFilePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.png`;
        
        try {
          // 将二进制数据写入文件
          wx.getFileSystemManager().writeFileSync(
            tempFilePath,
            res.data,
            'binary'
          );

          // 验证图片是否有效
          await new Promise((resolve, reject) => {
            wx.getImageInfo({
              src: tempFilePath,
              success: () => {
                this.setData({
                  resultImagePath: tempFilePath
                });
                resolve();
              },
              fail: reject
            });
          });

          wx.showToast({
            title: '处理成功',
            icon: 'success'
          });
        } catch (err) {
          console.error('保存或验证图片失败：', err);
          this.handleError('图片处理失败');
        }
      } else {
        let errorMsg = '处理失败';
        if (res.data) {
          try {
            // 尝试解析错误信息
            const decoder = new TextDecoder('utf-8');
            const errorText = decoder.decode(res.data);
            const errorData = JSON.parse(errorText);
            errorMsg = errorData.errors?.[0]?.title || '处理失败';
          } catch (e) {
            console.error('解析错误信息失败：', e);
          }
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('去除背景失败：', err);
      this.handleError(err.message || '处理失败');
    } finally {
      this.setData({ isProcessing: false });
    }
  },

  // 统一错误处理
  handleError(message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
    // 清除可能存在的无效结果图片
    this.setData({
      resultImagePath: ''
    });
  },

  // 保存图片
  saveImage() {
    if (!this.data.resultImagePath) {
      wx.showToast({
        title: '请先处理图片',
        icon: 'none'
      });
      return;
    }

    // 检查是否有保存到相册的权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          // 没有权限，向用户发起授权请求
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.saveImageToAlbum();
            },
            fail: () => {
              // 用户拒绝授权，引导用户去设置页面开启权限
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting['scope.writePhotosAlbum']) {
                          this.saveImageToAlbum();
                        }
                      }
                    });
                  }
                }
              });
            }
          });
        } else {
          // 已有权限，直接保存
          this.saveImageToAlbum();
        }
      }
    });
  },

  // 实际保存图片到相册的方法
  saveImageToAlbum() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultImagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('保存失败：', err);
        this.handleError('保存失败');
      }
    });
  },

  // 重新选择
  resetImage() {
    this.setData({
      tempImagePath: '',
      resultImagePath: '',
      isProcessing: false
    });
  }
})