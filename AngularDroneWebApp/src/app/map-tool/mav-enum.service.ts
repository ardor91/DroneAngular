import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class MavEnumsService {

    constructor() { }

    commands: Array<CommandLongModel> = [
      {
        commandId: 400,
        command: "MAV_CMD_COMPONENT_ARM_DISARM",
        param1: "1 to arm, 0 to disarm",
        param2: "",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 246,
        command: "MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN",
        param1: "0: Do nothing for autopilot, 1: Reboot autopilot, 2: Shutdown autopilot, 3: Reboot autopilot and keep it in the bootloader until upgraded.",
        param2: "0: Do nothing for onboard computer, 1: Reboot onboard computer, 2: Shutdown onboard computer, 3: Reboot onboard computer and keep it in the bootloader until upgraded.",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 22,
        command: "MAV_CMD_NAV_TAKEOFF",
        param1: "Minimum pitch",
        param2: "",
        param3: "",
        param4: "Yaw angle",
        param5: "Latitude",
        param6: "Longitude",
        param7: "Altitude"
      },
      {
        commandId: 21,
        command: "MAV_CMD_NAV_LAND",
        param1: "Minimum target altitude if landing is aborted",
        param2: "Precision land mode.",
        param3: "",
        param4: "Desired yaw angle. NaN for unchanged.",
        param5: "Latitude",
        param6: "Longitude",
        param7: "Landing altitude"
      },
      {
        commandId: 16,
        command: "MAV_CMD_NAV_WAYPOINT",
        param1: "Hold time in decimal seconds.",
        param2: "Acceptance radius in meters",
        param3: "0 to pass through the WP",
        param4: "Desired yaw angle at waypoint",
        param5: "Latitude",
        param6: "Longitude",
        param7: "Altitude"
      },
      {
        commandId: 20,
        command: "MAV_CMD_NAV_RETURN_TO_LAUNCH",
        param1: "",
        param2: "",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 30,
        command: "MAV_CMD_NAV_CONTINUE_AND_CHANGE_ALT",
        param1: "Climb or Descend (0 = Neutral, command completes when within 5m of this command's altitude, 1 = Climbing, command completes when at or above this command's altitude, 2 = Descending, command completes when at or below this command's altitude.",
        param2: "",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: "Desired altitude in meters"
      },
      {
        commandId: 82,
        command: "MAV_CMD_NAV_SPLINE_WAYPOINT",
        param1: "Hold time in decimal seconds.",
        param2: "",
        param3: "",
        param4: "",
        param5: "Latitude",
        param6: "Longitude",
        param7: "Altitude"
      },
      {
        commandId: 92,
        command: "MAV_CMD_NAV_GUIDED_ENABLE",
        param1: "On / Off (> 0.5f on)",
        param2: "",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 20,
        command: "MAV_CMD_NAV_RETURN_TO_LAUNCH",
        param1: "",
        param2: "",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 178,
        command: "MAV_CMD_DO_CHANGE_SPEED",
        param1: "Speed type (0=Airspeed, 1=Ground Speed, 2=Climb Speed, 3=Descent Speed)",
        param2: "Speed (m/s, -1 indicates no change)",
        param3: "Throttle ( Percent, -1 indicates no change)",
        param4: "absolute or relative [0,1]",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 183,
        command: "MAV_CMD_DO_SET_SERVO",
        param1: "Servo number",
        param2: "PWM (microseconds, 1000 to 2000 typical)",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 193,
        command: "MAV_CMD_DO_PAUSE_CONTINUE",
        param1: "0: Pause current mission or reposition command, hold current position. 1: Continue mission. A VTOL capable vehicle should enter hover mode (multicopter and VTOL planes). A plane should loiter with the default loiter radius.",
        param2: "",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 176,
        command: "MAV_CMD_DO_SET_MODE",
        param1: "Mode, as defined by ENUM MAV_MODE",
        param2: "Custom mode - this is system specific, please refer to the individual autopilot specifications for details.",
        param3: "Custom sub mode - this is system specific, please refer to the individual autopilot specifications for details.",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 186,
        command: "MAV_CMD_DO_CHANGE_ALTITUDE",
        param1: "Altitude in meters",
        param2: "Mav frame of new altitude (see MAV_FRAME)",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
      {
        commandId: 179,
        command: "MAV_CMD_DO_SET_HOME",
        param1: "Use current (1=use current location, 0=use specified location)",
        param2: "",
        param3: "",
        param4: "",
        param5: "Latitude",
        param6: "Longitude",
        param7: "Altitude"
      },
      {
        commandId: 512,
        command: "MAV_CMD_REQUEST_MESSAGE",
        param1: "The MAVLink message ID of the requested message.",
        param2: "Index id (if appropriate). The use of this parameter (if any), must be defined in the requested message.",
        param3: "",
        param4: "",
        param5: "",
        param6: "",
        param7: ""
      },
    ];

    ackMessages = [
      {id: 0, message: "ACCEPTED and EXECUTED"},
      {id: 1, message: "TEMPORARY REJECTED"},
      {id: 2, message: "DENIED"},
      {id: 3, message: "UNKNOWN/UNSUPPORTED"},
      {id: 4, message: "FAILED"},
      {id: 5, message: "IN PROGRESS"}
    ]

    copterMode = [
      {id: 0, message: "COPTER_MODE_STABILIZE"},
      {id: 1, message: "COPTER_MODE_ACRO"},
      {id: 2, message: "COPTER_MODE_ALT_HOLD"},
      {id: 3, message: "COPTER_MODE_AUTO"},
      {id: 4, message: "COPTER_MODE_GUIDED"},
      {id: 5, message: "COPTER_MODE_LOITER"},
      {id: 6, message: "COPTER_MODE_RTL"},
      {id: 7, message: "COPTER_MODE_CIRCLE"},
      {id: 9, message: "COPTER_MODE_LAND"},
      {id: 11, message: "COPTER_MODE_DRIFT"},
      {id: 13, message: "COPTER_MODE_SPORT"},
      {id: 14, message: "COPTER_MODE_FLIP"},
      {id: 15, message: "COPTER_MODE_AUTOTUNE"},
      {id: 16, message: "COPTER_MODE_POSHOLD"},
      {id: 17, message: "COPTER_MODE_BRAKE"},
      {id: 18, message: "COPTER_MODE_THROW"},
      {id: 19, message: "COPTER_MODE_AVOID_ADSB"},
      {id: 20, message: "COPTER_MODE_GUIDED_NOGPS"},
      {id: 21, message: "COPTER_MODE_SMART_RTL"}
    ]

    systemStatus = [
      {id: 0, message: "Uninitialized system, state is unknown"},
      {id: 1, message: "System is booting up"},
      {id: 2, message: "System is calibrating and not flight-ready"},
      {id: 3, message: "System is grounded and on standby"},
      {id: 4, message: "Motors are engaged"},
      {id: 5, message: "Critical state"},
      {id: 6, message: "Emergency! Lost control!"},
      {id: 7, message: "Power down sequence initialized"},
      {id: 8, message: "System is terminating"}
    ]

    mavTypes = [
      {id: 2, message: "Quadrotor"},
      {id: 0, message: "Generic"},
      {id: 13, message: "Hexarotor"}
    ]

    getMavType(id) {
      return this.mavTypes.filter((mode) => {
        return mode.id == id;
      })[0].message;      
    }

    getSystemStatus(id) {
      return this.systemStatus.filter((mode) => {
        return mode.id == id;
      })[0].message;      
    } 

    getCustomMode(id) {
      return this.copterMode.filter((mode) => {
        return mode.id == id;
      })[0].message;
    }

    getAckMessage(id) {
      return this.ackMessages.filter((ack) => {
        return ack.id == id;
      })[0].message;
    }

    getCommandDef(id) {
      return this.commands.filter((command) => {
        return command.commandId;
      })[0];
    }

    getCommandName(id) {
      return this.commands.filter((command) => {
        return command.commandId == id;
      })[0].command;
    }
  }