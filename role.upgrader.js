/*
 * Upgrader Role.
 *
 *  Only used early game.
 *  (Later we'll just use the haulers to dump massive amounts of energy into the controller)
 *
 * Logic:
 * 1) Try and pick up free resources (Don't harvest!!)
 * 2) If full, goto and upgrade controller
 *
 */

var roleUpgrader =
{
    /** @param {Creep} creep **/
    run: function(creep)
    {
        //console.log("I should be upgrading");
        var states = require('core.States');

        var nextState = '';
        var altState = '';
        
        if (!creep.memory.state) creep.memory.state = "PickUpResources";

        // Determine Current & Next States

        switch (creep.memory.state)
        {
            case 'PickUpResources':
                nextState = 'UpgradeController';
                altState = 'PickUpResources';
                break;

            case 'UpgradeController':
                nextState = 'PickUpResources';
                altState = 'PickUpResources';
                break;

            default:
                creep.memory.state = 'PickUpResources'
        }

        // Run The state
        
    //console.log("updatstate");
        states[creep.memory.state].run(creep, nextState, altState)

    }
};
module.exports = roleUpgrader;
