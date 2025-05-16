const { rest } = require('msw');

// S3はオブジェクトストレージなので、実際にはSDKをモックする方が良いが、
// ここではREST APIの場合の例を示す
const awsS3Handlers = [
  // S3アップロードURL取得のモック
  rest.post('https://s3.ap-southeast-1.amazonaws.com/:bucket', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.xml(`
        <PostResponse>
          <Location>https://s3.ap-southeast-1.amazonaws.com/${req.params.bucket}/test-file.jpg</Location>
          <Bucket>${req.params.bucket}</Bucket>
          <Key>test-file.jpg</Key>
          <ETag>"a1b2c3d4e5f6"</ETag>
        </PostResponse>
      `)
    );
  }),

  // S3ダウンロードのモック
  rest.get('https://s3.ap-southeast-1.amazonaws.com/:bucket/:key', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'image/jpeg'),
      ctx.body(new ArrayBuffer(8)) // ダミー画像データ
    );
  }),
];

// SDKモックの例
// 実際の実装ではAWS SDKをモックする必要がある場合の例
const mockS3Client = {
  upload: jest.fn().mockImplementation(() => ({
    promise: () => Promise.resolve({
      Location: 'https://s3.ap-southeast-1.amazonaws.com/test-bucket/test-file.jpg',
      ETag: '"a1b2c3d4e5f6"',
    }),
  })),
  getObject: jest.fn().mockImplementation(() => ({
    promise: () => Promise.resolve({
      Body: Buffer.from('test image data'),
      ContentType: 'image/jpeg',
    }),
  })),
};

module.exports = { awsS3Handlers, mockS3Client };