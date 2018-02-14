import {ACLRule, AccessType, Roles} from '../../../index';
/**
 * Access Control List
 */
export const TodoComponentACL = [
  // New ACL Rule (Allow addTodo and getTodos to any caller)
  new ACLRule({
    access: AccessType.ALLOW,
    roles: [Roles.Any],
    methods: ['addTodo', 'getTodos'],
  }),
];
