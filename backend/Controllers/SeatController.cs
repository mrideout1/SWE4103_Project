﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using backend.Controllers.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend
{
    [ApiController]
    public class SeatController : ControllerBase
    {
        private readonly ILogger<SeatController> _logger;

        public SeatController(ILogger<SeatController> logger)
        {
            _logger = logger;
        }

        [HttpPost, Route("api/student/seat/add")]
        public List<StudentDTO> AddSeatAPI(List<StudentDTO> students)
        {
            for (int i = 0; i < students.Count; i++)
            {
                if (!DatabaseConnector.Connector.CheckPass(students[i].email, students[i].pass))
                {
                    students[i].response = false;
                    continue;
                }
                else
                {
                    students[i].response = true;
                    for (int j = 0; j < students[i].classes.Length; j++)
                    {
                        bool res = DatabaseConnector.Connector.AddSeat(students[i].email,
                            students[i].classes[j].className, students[i].classes[j].seat.x, students[i].classes[j].seat.y);
                        students[i].response &= res;
                    }
                }
            }
            return students;
        }

        [HttpPost, Route("api/student/seat/get")]
        public List<StudentDTO> GetSeatAPI(List<StudentDTO> students)
        {
            for (int i = 0; i < students.Count; i++)
            {
                if (!DatabaseConnector.Connector.CheckPass(students[i].email, students[i].pass))
                {
                    students[i].response = false;
                    continue;
                }
                else
                {
                    students[i].response = true;
                    try
                    {
                        for (int j = 0; j < students[i].classes.Length; j++)
                        {
                            int[] res = DatabaseConnector.Connector.GetSeat(students[i].email,
                                students[i].classes[j].className);
                            students[i].classes[j].seat.x = res[0];
                            students[i].classes[j].seat.y = res[1];
                        }
                    }
                    catch (Exception)
                    {
                        students[i].response = false;
                    }
                }
            }
            return students;
        }

        [HttpPost, Route("api/student/seat/disable")]
        public List<ClassDTO> DisableSeatAPI(List<ClassDTO> classDTOs)
        {
            for (int i = 0; i < classDTOs.Count; i++)
            {
                bool res = DatabaseConnector.Connector.DisableSeat(classDTOs[i].className,
                            classDTOs[i].seat.x, classDTOs[i].seat.y);
                classDTOs[i].response = res;
            }

            return classDTOs;
        }

        [HttpPost, Route("api/student/seat/reserve")]
        public List<ClassDTO> ReserveSeatAPI(List<ClassDTO> classDTOs)
        {
            for (int i = 0; i < classDTOs.Count; i++)
            {
                bool res = DatabaseConnector.Connector.ReserveSeat(classDTOs[i].className,
                classDTOs[i].seat.x, classDTOs[i].seat.y);
                classDTOs[i].response = res;
            }
            return classDTOs;
        }
    }
}