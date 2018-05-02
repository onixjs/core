import {
  IAppOperation,
  IComponentConfig,
  promiseSeries,
  IACLRule,
  IGroup,
  Injector,
  IModuleConfig,
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
    // Name of method to be executed
    name: string,
    // Application operation reference
    operation: IAppOperation,
    // Module level configurations
    moduleConfig: IModuleConfig,
    // Component level configurations
    componentConfig: IComponentConfig,
    // Scoped injector, it will inject module level dependencies
    injector: Injector,
  ) {
    // Verify the parent component provides an ACL Configuration
    if (Array.isArray(componentConfig.acl)) {
      // Need to await the result to allow finding a truthy result
      return (await promiseSeries(
        // Iterate over given ACL Rules
        componentConfig.acl.map((Rule: new () => IACLRule) => async () => {
          // Need an instance from this rule class.
          let rule: IACLRule | null = new Rule();
          // Make sure this method has any group associated
          // Or there is a whildcard for any component method
          if (rule.methods.find(value => value === name || value === '*')) {
            // Await for group async operations, so we can find thruthy results
            const results = await promiseSeries(
              rule.groups.map(Group => async () => {
                // Create group instance
                let group: IGroup | null = new Group();
                // Inject whatever has been requested into this group
                await injector.inject(Group, group, moduleConfig);
                // Execute group access method to verify operation request access
                const groupResult: boolean = await group.access(
                  operation.message.request,
                  rule!.access,
                );
                // Wipe group instance
                group = null;
                // return group results
                return groupResult;
              }),
            );
            // Wipe ACL Rule instance
            rule = null;
            // Find if any of the group results gave access for this method.
            return results.find(value => value === true) ? true : false;
          } else {
            // Wipe ACL Rule instance
            rule = null;
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
