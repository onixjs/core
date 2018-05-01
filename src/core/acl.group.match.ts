import {
  IAppOperation,
  IComponentConfig,
  promiseSeries,
  IACLRule,
  IGroup,
} from '..';
/**
 * @class GroupMatch
 * @author Joanthan Casarrubias
 * @description This class will verify access for a given method name
 * form a list of ACL Rules from a provided component configuration.
 */
export class GroupMatch {
  /**
   * @method verify
   * @param name
   * @param operation
   * @param config
   * @author Jonathan Casarrubias
   * @description This method will verify acces to a specific method according the
   * component ACL Configuration and the operation request.
   */
  static async verify(
    name: string,
    operation: IAppOperation,
    config: IComponentConfig,
  ) {
    // Verify the parent component provides an ACL Configuration
    if (Array.isArray(config.acl)) {
      // Need to await the result to allow finding a truthy result
      return (await promiseSeries(
        // Iterate over given ACL Rules
        config.acl.map((Rule: new () => IACLRule) => async () => {
          // Need an instance from this rule class.
          const rule: IACLRule = new Rule();
          // Make sure this method has any group associated
          // Or there is a whildcard for any component method
          if (rule.methods.find(value => value === name || value === '*')) {
            // Await for group async operations, so we can find thruthy results
            const results = await promiseSeries(
              rule.groups.map(Group => async () => {
                const group: IGroup = new Group();
                // Execute group access method to verify operation request access
                return group.access(operation.message.request, rule.access);
              }),
            );
            // Find if any of the group results gave access for this method.
            return results.find(value => value === true) ? true : false;
          } else {
            // Don't give access if there is no group associated for this method
            return false;
          }
        }),
      )).find(value => value === true);
    } else {
      // Don't give access if there isn't ACL rule for parent component
      return false;
    }
  }
}
