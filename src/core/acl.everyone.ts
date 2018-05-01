import {IACLRule, AccessType, GroupList} from '../index';
import {Groups} from './acl.groups';
/**
 * @class AllowEveryone
 * @author Jonathan Casarrubias
 * @deprecated
 * @license MIT
 * @description This class might be used when trying to enable
 * all methods from a component to everyone
 **/
export class AllowEveryone implements IACLRule {
  // Define methods to be granted
  methods: string[] = ['*'];
  // Define Access Grant
  access: AccessType = AccessType.ALLOW;
  // Define groups with the defined grant
  groups: GroupList = [Groups.Everyone];
}
