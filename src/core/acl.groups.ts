import {IRequest, AccessType, IGroup} from '../interfaces';
/**
 * @namespace Groups
 * @author Jonathan Casarrubias
 * @license MIT
 * @description System provided roles. These come out of the box
 * and helps to avoid programming basic roles on each project.
 **/
export namespace Groups {
  /**
   * @class Everyone
   * @author Jonathan Casarrubias
   * @license MIT
   * @description This role is used to either grant or deny access to
   * anyone in a specific method
   **/
  export class Everyone implements IGroup {
    /**
     * @method verify
     * @param request
     * @param type
     * @description This method is used by the system as a hook to provide
     * verification business logic. In this case any caller is allowed or denied
     * according the rule
     **/
    async access(request: IRequest, type: AccessType) {
      return type === AccessType.ALLOW;
    }
  }
}
