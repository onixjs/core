import {IACLRule, AccessType, IRole} from '../index';
/**
 * @class ACLRule
 * @author Jonathan Casarrubias
 * @license MIT
 * @description This class is required to create ACL for components
 */
export class ACLRule implements IACLRule {
  access: AccessType = AccessType.DENY;
  methods: string[];
  roles: (new () => IRole)[];
  constructor(input?: IACLRule) {
    if (input && Object.keys(input).length > 0) {
      Object.assign(this, input);
    }
  }
}
