import {IRole, IComponentConfig, IACLRule, AccessType} from '../index';
/**
 * @namespace Roles
 * @author Jonathan Casarrubias
 * @license MIT
 * @description System provided roles. These come out of the box
 * and helps to avoid programming basic roles on each project.
 */
export namespace Roles {
  /**
   * @class Any
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This role is used to give public access for some of
   * the methdos
   */
  export class Any implements IRole {
    /**
     * @method verify
     * @param request
     * @description This method is used by the system as a hook to provide
     * verification business logic. In this case any caller is allowed
     */
    async access(name: string, request: any): Promise<boolean> {
      console.log(request);
      return new Promise<boolean>((resolve, reject) => resolve(true));
    }
  }
}
export class RoleMatch {
  /**
   * @method access
   * @param name
   * @param config
   * @author Jonathan Casarrubias
   * @description This method will access if a given method name is executable
   * by the current caller.
   */
  static async access(
    name: string,
    request: any,
    config: IComponentConfig,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // First filter any rule specified for this method
      const rules: IACLRule[] = config.ACL.filter(
        (rule: IACLRule) =>
          rule.methods.indexOf(name) >= 0 && rule.access === AccessType.ALLOW,
      );
      // Every RPC Method is closed by default, if there are no rules, then there is no access
      if (rules.length === 0) {
        console.log(
          `Onix RoleMatch verification fail for method ${name}, no acl rules were found.`,
        );
        resolve(false);
      }
      // If there are rules for this method then lets execute those
      if (
        rules.map((rule: IACLRule) =>
          rule.roles.filter((RClass: new () => IRole) => {
            const role: IRole = new RClass();
            return role.access(name, request);
          }),
        )
      ) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }
}
