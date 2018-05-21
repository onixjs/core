import {
  IComponent,
  CallConnect,
  RPC,
  Stream,
  Component,
  AllowEveryone,
} from '../../../src/index';
/**
 * @class BobComponent
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class provides with functionality
 * for testing purposes, storing Bob objects in memory.
 */
@Component({
  acl: [AllowEveryone],
})
export class BobComponent implements IComponent {
  private connect: CallConnect = new CallConnect({
    app: 'AliceApp',
    module: 'AliceModule',
    component: 'AliceComponent',
    method: 'callMe',
    broker: {
      host: '127.0.0.1',
      port: 2999,
    },
  });

  init() {}
  destroy() {}

  @RPC()
  async exposedCall(payload, metadata) {
    try {
      this.connect.config.method = 'callMe';
      const result = await this.connect.call(payload, metadata);
      return result;
    } catch (e) {
      return e.message;
    }
  }

  @RPC()
  async exposedFakeAppCall(payload) {
    try {
      this.connect.config.app = 'fakeApp';
      const result = await this.connect.call(payload);
      return result;
    } catch (e) {
      return e.message;
    }
  }

  @RPC()
  async exposedFakeModuleCall(payload) {
    try {
      this.connect.config.app = 'AliceApp';
      this.connect.config.module = 'fakeModule';
      const result = await this.connect.call(payload);
      return result;
    } catch (e) {
      return e.message;
    }
  }

  @RPC()
  async exposedFakeComponentCall(payload) {
    try {
      this.connect.config.module = 'AliceModule';
      this.connect.config.component = 'fakeComponent';
      const result = await this.connect.call(payload);
      return result;
    } catch (e) {
      return e.message;
    }
  }

  @RPC()
  async exposedFakeMethodCall(payload) {
    try {
      this.connect.config.component = 'AliceComponent';
      this.connect.config.method = 'fakeCallMe';
      const result = await this.connect.call(payload);
      return result;
    } catch (e) {
      return e.message;
    }
  }

  @Stream()
  async exposedStream(stream) {
    try {
      this.connect.config.method = 'streamMe';
      await this.connect.stream(stream);
    } catch (e) {
      return e.message;
    }
  }
}
