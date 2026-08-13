import Appointment from "../models/Appointment.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Schedule from "../models/Schedule.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getDayName,
  getTodayString,
  minutesToTime,
  timeToMinutes,
} from "../utils/time.js";


/* =========================================================
   GET USER ID
========================================================= */

const getUserId = (req) =>
  req.user?._id || req.user?.id;


/* =========================================================
   ACTIVE QUEUE STATUSES

   Only these appointments will be counted
   in patient queue.

   completed
   cancelled
   rejected
   no-show

   are NOT counted.
========================================================= */

const QUEUE_STATUSES = [
  "pending",
  "confirmed",
];


/* =========================================================
   CREATE UNIQUE BOOKING KEY
========================================================= */

const activeBookingKey = (
  doctorId,
  date,
  startTime
) =>
  `${String(doctorId)}:${date}:${startTime}`;


/* =========================================================
   VALIDATE APPOINTMENT SLOT
========================================================= */

const validateSlot = async ({
  doctorId,
  date,
  startTime,
}) => {
  const doctor = await DoctorProfile.findOne({
    user: doctorId,
    approvalStatus: "approved",
  });

  if (!doctor) {
    return {
      error: "Approved doctor not found",
    };
  }


  const schedule = await Schedule.findOne({
    doctor: doctorId,
    dayOfWeek: getDayName(date),
    isAvailable: true,
  });


  if (!schedule) {
    return {
      error:
        "Doctor is not available on this day",
    };
  }


  const start = timeToMinutes(
    schedule.startTime
  );

  const end = timeToMinutes(
    schedule.endTime
  );

  const selected = timeToMinutes(
    startTime
  );


  /*
    Invalid time format protection
  */

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(selected)
  ) {
    return {
      error: "Invalid appointment time",
    };
  }


  const valid =
    selected >= start &&
    selected +
      schedule.slotDuration <=
      end &&
    (selected - start) %
      schedule.slotDuration ===
      0;


  if (!valid) {
    return {
      error:
        "Invalid appointment slot",
    };
  }


  return {
    doctor,
    schedule,
    endTime: minutesToTime(
      selected +
        schedule.slotDuration
    ),
  };
};


/* =========================================================
   GET NEXT SERIAL NUMBER

   This is used only when creating appointment.

   Final queue serial is calculated dynamically
   inside getMyAppointments.
========================================================= */

const getNextSerialNumber = async ({
  doctorId,
  appointmentDate,
}) => {
  const lastAppointment =
    await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
    })
      .sort({
        serialNumber: -1,
      })
      .select("serialNumber");


  const lastSerial = Number(
    lastAppointment?.serialNumber
  );


  if (
    !Number.isFinite(lastSerial) ||
    lastSerial < 0
  ) {
    return 1;
  }


  return Math.floor(lastSerial) + 1;
};


/* =========================================================
   CREATE APPOINTMENT
========================================================= */

export const createAppointment =
  asyncHandler(async (req, res) => {
    const patientId =
      getUserId(req);


    const {
      doctorId,
      appointmentDate,
      startTime,
      reason,
      symptoms,
    } = req.body;


    /*
      Authentication
    */

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message:
          "Patient authentication required",
      });
    }


    /*
      Required fields
    */

    if (
      !doctorId ||
      !appointmentDate ||
      !startTime ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Doctor, date, time and reason are required",
      });
    }


    /*
      Validate date
    */

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        appointmentDate
      ) ||
      appointmentDate <
        getTodayString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Choose a valid present or future date",
      });
    }


    /*
      Validate doctor's schedule
    */

    const slot =
      await validateSlot({
        doctorId,
        date: appointmentDate,
        startTime,
      });


    if (slot.error) {
      return res.status(400).json({
        success: false,
        message: slot.error,
      });
    }


    /*
      Unique booking key
    */

    const bookingKey =
      activeBookingKey(
        doctorId,
        appointmentDate,
        startTime
      );


    /*
      Check if this exact slot
      is already booked.
    */

    const existingBooking =
      await Appointment.findOne({
        bookingKey,
        status: {
          $in: QUEUE_STATUSES,
        },
      });


    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message:
          "This appointment slot is already booked",
      });
    }


    /*
      Generate safe database serial.

      This serial is only a stored fallback.

      Actual patient-facing queue serial
      is calculated dynamically later.
    */

    const serialNumber =
      await getNextSerialNumber({
        doctorId,
        appointmentDate,
      });


    /*
      Create appointment
    */

    let appointment;


    try {
      appointment =
        await Appointment.create({
          patient: patientId,
          doctor: doctorId,

          appointmentDate,

          startTime,

          endTime:
            slot.endTime,

          serialNumber,

          reason,

          symptoms:
            symptoms || "",

          status: "pending",

          bookingKey,
        });
    } catch (error) {
      /*
        MongoDB duplicate key protection
      */

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This appointment slot is already booked",
        });
      }

      throw error;
    }


    /*
      Populate response
    */

    await appointment.populate([
      {
        path: "patient",
        select:
          "name email phone",
      },
      {
        path: "doctor",
        select:
          "name email phone",
      },
    ]);


    res.status(201).json({
      success: true,
      message:
        "Appointment request submitted",
      appointment,
    });
  });


/* =========================================================
   GET MY APPOINTMENTS

   IMPORTANT:

   Patient sees queue based on ALL patients
   booked with the same doctor on the same date.

   NOT based only on logged-in patient's appointments.
========================================================= */

export const getMyAppointments =
  asyncHandler(async (req, res) => {
    const userId =
      getUserId(req);


    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }


    /*
      Get current user's appointments
    */

    const query =
      req.user.role === "doctor"
        ? {
            doctor: userId,
          }
        : {
            patient: userId,
          };


    const appointments =
      await Appointment.find(query)
        .populate(
          "patient",
          "name email phone"
        )
        .populate(
          "doctor",
          "name email phone"
        )
        .sort({
          appointmentDate: -1,
          startTime: -1,
        });


    /*
      =======================================================
      GROUP CURRENT USER'S APPOINTMENTS
      BY DOCTOR + DATE
      =======================================================
    */

    const queueGroups = {};


    for (
      const appointment of appointments
    ) {
      const doctorId =
        appointment.doctor?._id ||
        appointment.doctor;


      const date =
        appointment.appointmentDate;


      if (
        !doctorId ||
        !date
      ) {
        continue;
      }


      const key =
        `${String(doctorId)}_${date}`;


      if (!queueGroups[key]) {
        queueGroups[key] = [];
      }


      queueGroups[key].push(
        appointment
      );
    }


    /*
      =======================================================
      CALCULATE QUEUE FOR EACH GROUP
      =======================================================
    */

    for (
      const key of Object.keys(
        queueGroups
      )
    ) {
      const group =
        queueGroups[key];


      if (!group.length) {
        continue;
      }


      const doctorId =
        group[0].doctor?._id ||
        group[0].doctor;


      const appointmentDate =
        group[0].appointmentDate;


      /*
        =====================================================
        GET ALL ACTIVE BOOKINGS

        This is the most important query.

        It gets EVERY patient for:

        same doctor
        same date

        not just current patient.
        =====================================================
      */

      const allAppointments =
        await Appointment.find({
          doctor: doctorId,

          appointmentDate,

          status: {
            $in: QUEUE_STATUSES,
          },
        })
          .sort({
            startTime: 1,
            createdAt: 1,
          });


      /*
        =====================================================
        SORT BY APPOINTMENT TIME

        Earlier slot = earlier serial.

        If two appointments somehow have
        same startTime, older booking first.
        =====================================================
      */

      allAppointments.sort(
        (a, b) => {
          const timeA =
            String(
              a.startTime || ""
            );

          const timeB =
            String(
              b.startTime || ""
            );


          if (
            timeA !== timeB
          ) {
            return timeA.localeCompare(
              timeB
            );
          }


          return (
            new Date(
              a.createdAt
            ).getTime() -
            new Date(
              b.createdAt
            ).getTime()
          );
        }
      );


      /*
        =====================================================
        TOTAL ACTIVE PATIENTS
        =====================================================
      */

      const totalPatients =
        allAppointments.length;


      /*
        =====================================================
        CREATE QUEUE MAP
        =====================================================
      */

      const queueMap =
        new Map();


      allAppointments.forEach(
        (
          appointment,
          index
        ) => {
          queueMap.set(
            String(
              appointment._id
            ),
            {
              serialNumber:
                index + 1,

              patientsBefore:
                index,

              totalPatients,
            }
          );
        }
      );


      /*
        =====================================================
        ATTACH QUEUE INFO TO CURRENT USER'S
        APPOINTMENTS ONLY
        =====================================================
      */

      group.forEach(
        (appointment) => {
          const queueInfo =
            queueMap.get(
              String(
                appointment._id
              )
            );


          /*
            If appointment is completed/cancelled
            it won't be present in queueMap.

            Therefore no active queue info
            is shown for it.
          */

          if (!queueInfo) {
            appointment._doc.serialNumber =
              null;

            appointment._doc.patientsBefore =
              0;

            appointment._doc.totalPatients =
              0;

            return;
          }


          /*
            IMPORTANT:

            These values are added ONLY
            to API response.

            They are NOT saved to MongoDB.
          */

          appointment._doc.serialNumber =
            queueInfo.serialNumber;


          appointment._doc.patientsBefore =
            queueInfo.patientsBefore;


          appointment._doc.totalPatients =
            queueInfo.totalPatients;
        }
      );
    }


    /*
      =======================================================
      RESPONSE
      =======================================================
    */

    res.json({
      success: true,
      appointments,
    });
  });


/* =========================================================
   UPDATE APPOINTMENT STATUS + PRESCRIPTION
========================================================= */

export const updateStatus =
  asyncHandler(async (req, res) => {
    const userId =
      getUserId(req);


    const {
      status,
      doctorNote = "",
      prescription = "",
    } = req.body;


    const allowed = [
      "confirmed",
      "rejected",
      "completed",
      "no-show",
    ];


    if (
      !allowed.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status",
      });
    }


    /*
      Find appointment owned by
      logged-in doctor
    */

    const appointment =
      await Appointment.findOne({
        _id:
          req.params.appointmentId,

        doctor: userId,
      });


    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found",
      });
    }


    /*
      Completed appointment
      requires prescription
    */

    if (
      status === "completed" &&
      !String(
        prescription
      ).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Prescription is required before completing appointment",
      });
    }


    /*
      Update status
    */

    appointment.status =
      status;


    appointment.doctorNote =
      doctorNote;


    /*
      Completed appointment
    */

    if (
      status === "completed"
    ) {
      appointment.prescription =
        String(
          prescription
        ).trim();

      appointment.prescribedAt =
        new Date();
    }


    /*
      Rejected appointment

      Free the booking slot
      so another patient can book it.
    */

    if (
      status === "rejected"
    ) {
      appointment.bookingKey =
        undefined;
    }


    /*
      Cancelled/rejected/no-show
      are no longer active queue.
    */

    if (
      [
        "rejected",
        "no-show",
      ].includes(status)
    ) {
      appointment.bookingKey =
        undefined;
    }


    await appointment.save();


    /*
      Populate response
    */

    await appointment.populate([
      {
        path: "patient",
        select:
          "name email phone",
      },
      {
        path: "doctor",
        select:
          "name email phone",
      },
    ]);


    res.json({
      success: true,
      message:
        "Appointment updated",
      appointment,
    });
  });


/* =========================================================
   CANCEL APPOINTMENT
========================================================= */

export const cancelAppointment =
  asyncHandler(async (req, res) => {
    const userId =
      getUserId(req);


    /*
      Admin can cancel any appointment.

      Patient can cancel only
      their own appointment.
    */

    const query =
      req.user.role === "admin"
        ? {
            _id:
              req.params
                .appointmentId,
          }
        : {
            _id:
              req.params
                .appointmentId,

            patient: userId,
          };


    const appointment =
      await Appointment.findOne(
        query
      );


    if (!appointment) {
      return res.status(404).json({
        success: false,
        message:
          "Appointment not found",
      });
    }


    /*
      Already finished appointments
      cannot be cancelled.
    */

    if (
      [
        "completed",
        "no-show",
        "cancelled",
        "rejected",
      ].includes(
        appointment.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This appointment cannot be cancelled",
      });
    }


    /*
      Cancel appointment
    */

    appointment.status =
      "cancelled";


    appointment.cancellationReason =
      req.body.reason ||
      "Cancelled by user";


    /*
      Free the slot
    */

    appointment.bookingKey =
      undefined;


    await appointment.save();


    res.json({
      success: true,
      message:
        "Appointment cancelled",
      appointment,
    });
  });