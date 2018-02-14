import {IRole} from '../index';
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
    async verify(request): Promise<boolean> {
      console.log(request);
      return new Promise<boolean>((resolve, reject) => resolve(true));
    }
  }
}
