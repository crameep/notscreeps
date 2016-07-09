/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('state.RepairUrgent');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
run: function (creep, newState, altState)
{
    //console.log('starting repairs');
    //Urgent Repair - structures below 20% HP
    var targets = creep.room.find(FIND_STRUCTURES, {
         filter: (s) => s.hits <  s.hitsMax * 0.05});
    
    targets.sort((a,b) => a.hits - b.hits);
     
    
    if(targets.length > 0)
    {
        
  
        //console.log(creep.name + "is doing Urgent repair of: " + targets[0].structureType + "(" + targets[0].id + ")" + " HITS: " + targets[0].hits + "/" + targets[0].hitsMax);

        if(creep.repair(targets[0]) == ERR_NOT_IN_RANGE)
        {
           // console.log("moving to target");
            creep.moveTo(targets[0]);
        }
    }
    else
    {
        // No valid targets for repair, perform alternate tasks
        creep.memory.state = altState
        creep.say(creep.memory.state);
    }
    if(creep.carry.energy == 0)
    {
        creep.memory.state = newState
        creep.say(creep.memory.state);
    }
}
};
