import {ICallConfig, IOnixSchema} from '../interfaces';
import {Utils} from '@onixjs/sdk/dist/utils';
import {NodeJS} from '@onixjs/sdk/dist/adapters/node.adapters';
import {IAppOperation, OperationType, IMetaData} from '@onixjs/sdk';
/**
 * @class CallConnect
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class will provide connectivity
 * between soa services.
 *
 * It will provide connection throgh IO Streams to other
 * services living in the same cluster.
 */
export class CallConnect {
  /**
   * @property client
   * @description This property creates an HTTP client
   * instance to call for the broker schema.
   */
  private client: NodeJS.HTTP = new NodeJS.HTTP();
  /**
   * @property schema
   * @description This property contains a reference
   * of the onix schema
   */
  private schema: IOnixSchema;
  /**
   * @constructor
   * @param config
   * @description Receives the ICallConfig in order
   * to validate calls, streams and schema.
   * Only valid calls and streams will be executed,
   * of course avoiding sending falsy information to
   * the broker.
   */
  constructor(public config: ICallConfig) {}
  /**
   * @method getSchema
   * @description This method assigns a singleton schema
   * that will be pulled once from the current onix broker.
   */
  private async getSchema() {
    // Singleton schema
    if (this.schema) {
      return;
    }
    // If the user is sending a token then verify with the sso.
    // TODO Add Result Interace from @onixjs/sdk
    this.schema = <IOnixSchema>(
      await this.client.get(
        `http://${
          this.config.broker.host ? this.config.broker.host : '127.0.0.1'
        }:${this.config.broker.port}/.well-known/onixjs-schema`,
      )
    );
  }
  /**
   * @method call
   * @param payload
   * @param metadata
   * @description This method will coordinate with the OnixJS Broker to
   * execute a RPC, that can be either on this SOA Service or within
   * any other SOA Service living in the same cluster.
   */
  async call<T>(
    payload: T,
    metadata: IMetaData = {
      stream: false,
      subscription: '$anonymous',
    },
  ): Promise<T> {
    // Hard copy the configuration
    const config: ICallConfig = JSON.parse(JSON.stringify(this.config));
    // Make sure everything is well configured in order to make this call
    await this.validate('rpc', config);
    // Ok cool, lets make the call to the broker
    return new Promise<T>((resolve, reject) => {
      // Set metadata for this call not being a stream
      metadata.stream = false;
      // Create App Operation
      const operation: IAppOperation = {
        uuid: Utils.uuid(),
        type: OperationType.ONIX_REMOTE_CALL_PROCEDURE,
        message: {
          rpc: `${config.app}.${config.module}.${config.component}.${
            config.method
          }`,
          request: {
            metadata,
            payload,
          },
        },
      };
      // Listen for broker response
      process.on('message', (response: IAppOperation) => {
        if (
          (response.uuid === operation.uuid,
          response.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE)
        ) {
          if (
            response.message.request.payload.code &&
            response.message.request.payload.message
          ) {
            reject(response.message.request.payload);
          } else {
            resolve(response.message.request.payload);
          }
        }
      });
      // Send result back to broker
      if (process.send) process.send(operation);
    });
  }
  /**
   * @method stream
   * @param handler
   * @param metadata
   * @description This method will register a stream connection
   * to other service living in the same cluster of services.
   */
  async stream<T>(
    handler: (payload: T, metadata: IMetaData) => void,
    metadata: IMetaData = {
      stream: true,
      subscription: '$anonymous',
    },
  ) {
    // Hard copy the configuration
    const config: ICallConfig = JSON.parse(JSON.stringify(this.config));
    // Make sure everything is well configured in order to make this call
    await this.validate('rpc', config);
    // complete metadata in case is not existent
    if (!metadata.stream) metadata.stream = true;
    // Create App Operation
    const operation: IAppOperation = {
      uuid: Utils.uuid(),
      type: OperationType.ONIX_REMOTE_CALL_STREAM,
      message: {
        rpc: `${config.app}.${config.module}.${config.component}.${
          config.method
        }`,
        request: {
          metadata,
          payload: undefined,
        },
      },
    };
    // Listen for broker response
    process.on('message', (response: IAppOperation) => {
      if (
        (response.uuid === operation.uuid,
        response.type === OperationType.ONIX_REMOTE_CALL_PROCEDURE_RESPONSE)
      ) {
        handler(
          response.message.request.payload,
          response.message.request.metadata,
        );
      }
    });
    // Send result back to broker
    if (process.send) process.send(operation);
  }
  /**
   * @method validate
   * @param type
   * @param config
   * @description This method will validate if the current configuration
   * is correct verifying with the OnixJS Schema.
   */
  private async validate(type: string, config: ICallConfig) {
    // Wait for schema to available
    try {
      await this.getSchema();
    } catch (e) {
      throw e;
    }
    // Verify the config makes sense
    if (!this.schema[this.config.app]) {
      throw new Error(
        `ONIXJS: The app "${
          this.config.app
        }" is not hosted by the provided broker.`,
      );
    }
    if (!this.schema[this.config.app].modules[this.config.module]) {
      throw new Error(
        `ONIXJS: The module "${this.config.module}" doesn't belongs to app "${
          this.config.app
        }".`,
      );
    }
    if (
      !this.schema[this.config.app].modules[this.config.module][
        this.config.component
      ]
    ) {
      throw new Error(
        `ONIXJS: The component "${
          this.config.component
        }" doesn't belongs to module "${this.config.module}".`,
      );
    }
    if (
      !this.schema[this.config.app].modules[this.config.module][
        this.config.component
      ][this.config.method]
    ) {
      throw new Error(
        `ONIXJS: The method "${
          this.config.method
        }" doesn't belongs to component "${this.config.component}".`,
      );
    }
    if (
      type !==
      this.schema[this.config.app].modules[this.config.module][
        this.config.component
      ][this.config.method]
    ) {
      throw new Error(
        `ONIXJS: The method ${this.config.method} is not type of ${type}.`,
      );
    }
  }
}
