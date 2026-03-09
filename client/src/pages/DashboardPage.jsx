import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { sendApiRequest } from "../api.js";

const subjectOptions = [
  { name: "Arabic", category: "IB" },
  { name: "Business Management", category: "IB" },
  { name: "Computer Science", category: "General" },
  { name: "Economics", category: "IB" },
  { name: "English Lang-Lit", category: "IB" },
  { name: "Islamic Studies", category: "IB" },
  { name: "Math Applications & Int.", category: "IB" },
  { name: "Theory of Knowledge", category: "IB" },
  { name: "National-Social Studies", category: "General" },
  { name: "Arabic Acquisition", category: "MYP" },
  { name: "Arabic literature", category: "MYP" },
  { name: "English Lang-Lit", category: "MYP" },
  { name: "Integrated Humanities", category: "MYP" },
  { name: "Integrated Science", category: "MYP" },
  { name: "Islamic Studies", category: "MYP" },
  { name: "Mathematics", category: "MYP" },
  { name: "Theatre", category: "MYP" },
  { name: "Arabic Acquisition", category: "MYP" },
  { name: "Biology", category: "MYP" },
  { name: "Chemistry & Physics", category: "MYP" },
  { name: "English Lang-Lit", category: "MYP" },
  { name: "Integrated Humanities", category: "MYP" },
  { name: "Islamic Studies", category: "General" },
  { name: "Mathematics", category: "MYP" },
  { name: "PE", category: "General" },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [reservationList, setReservationList] = useState([]);
  const [bookingWindow, setBookingWindow] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectSearchText, setSubjectSearchText] = useState("");
  const [subjectSortOption, setSubjectSortOption] = useState("name-asc");
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState("All");

  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [editSubjectSearchText, setEditSubjectSearchText] = useState("");
  const [editSubjectSortOption, setEditSubjectSortOption] = useState("name-asc");
  const [editSubjectCategoryFilter, setEditSubjectCategoryFilter] = useState("All");

  const [formData, setFormData] = useState({
    testDate: "",
    subjectName: "Computer Science",
    gradeLevel: 10,
    programType: "",
    testType: "summative",
    creditCount: 1
  });

  const [modalFormData, setModalFormData] = useState({
    id: null,
    testDate: "",
    subjectName: "",
    gradeLevel: 10,
    programType: "",
    testType: "summative",
    creditCount: 1
  });

  const [modalValidationErrors, setModalValidationErrors] = useState({});

  async function loadPageData() {
    const teacherResponse = await sendApiRequest("/auth/me");
    setTeacher(teacherResponse.teacher);

    const windowResponse = await sendApiRequest("/reservations/window");
    setBookingWindow(windowResponse);

    const reservationsResponse = await sendApiRequest("/reservations");
    setReservationList(reservationsResponse.reservations);
  }

  useEffect(() => {
    loadPageData().catch(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("teacher");
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  const calendarEvents = useMemo(() => {
    return reservationList.map((reservation) => {
      let eventTitle = `${reservation.subject_name} • G${reservation.grade_level}`;

      if (reservation.program_type) {
        eventTitle += ` • ${reservation.program_type}`;
      }

      eventTitle += ` • ${reservation.test_type}`;
      eventTitle += ` • ${reservation.credit_count}cr • ${reservation.username}`;

      return {
        id: String(reservation.id),
        title: eventTitle,
        start: reservation.test_date,
        allDay: true
      };
    });
  }, [reservationList]);

  const isOwnReservation =
    selectedReservation &&
    teacher &&
    Number(selectedReservation.teacher_id) === Number(teacher.id);

  const filteredSubjectOptions = useMemo(() => {
    const normalizedSearchText = subjectSearchText.trim().toLowerCase();

    let list = [...subjectOptions];

    if (subjectCategoryFilter !== "All") {
      list = list.filter((subject) => subject.category === subjectCategoryFilter);
    }

    if (normalizedSearchText) {
      list = list.filter((subject) =>
        subject.name.toLowerCase().includes(normalizedSearchText) ||
        subject.category.toLowerCase().includes(normalizedSearchText)
      );
    }

    if (subjectSortOption === "name-asc") {
      list.sort((firstItem, secondItem) => firstItem.name.localeCompare(secondItem.name));
    }

    if (subjectSortOption === "name-desc") {
      list.sort((firstItem, secondItem) => secondItem.name.localeCompare(firstItem.name));
    }

    if (subjectSortOption === "category") {
      list.sort((firstItem, secondItem) => {
        const categoryCompare = firstItem.category.localeCompare(secondItem.category);
        if (categoryCompare !== 0) {
          return categoryCompare;
        }
        return firstItem.name.localeCompare(secondItem.name);
      });
    }

    return list;
  }, [subjectSearchText, subjectSortOption, subjectCategoryFilter]);

  const filteredEditSubjectOptions = useMemo(() => {
    const normalizedSearchText = editSubjectSearchText.trim().toLowerCase();

    let list = [...subjectOptions];

    if (editSubjectCategoryFilter !== "All") {
      list = list.filter((subject) => subject.category === editSubjectCategoryFilter);
    }

    if (normalizedSearchText) {
      list = list.filter((subject) =>
        subject.name.toLowerCase().includes(normalizedSearchText) ||
        subject.category.toLowerCase().includes(normalizedSearchText)
      );
    }

    if (editSubjectSortOption === "name-asc") {
      list.sort((firstItem, secondItem) => firstItem.name.localeCompare(secondItem.name));
    }

    if (editSubjectSortOption === "name-desc") {
      list.sort((firstItem, secondItem) => secondItem.name.localeCompare(firstItem.name));
    }

    if (editSubjectSortOption === "category") {
      list.sort((firstItem, secondItem) => {
        const categoryCompare = firstItem.category.localeCompare(secondItem.category);
        if (categoryCompare !== 0) {
          return categoryCompare;
        }
        return firstItem.name.localeCompare(secondItem.name);
      });
    }

    return list;
  }, [editSubjectSearchText, editSubjectSortOption, editSubjectCategoryFilter]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("teacher");
    navigate("/login", { replace: true });
  }

  function isOutsideBookingWindow(dateText) {
    if (!bookingWindow) {
      return false;
    }

    return (
      dateText < bookingWindow.firstAllowedDate ||
      dateText > bookingWindow.lastAllowedDate
    );
  }

  function getReservedCreditsForDay(dateText) {
    return reservationList.reduce((total, reservation) => {
      if (reservation.test_date !== dateText) {
        return total;
      }

      return total + Number(reservation.credit_count);
    }, 0);
  }

  function getReservedCreditsForEditDay(dateText) {
    return reservationList.reduce((total, reservation) => {
      if (reservation.id === modalFormData.id) {
        return total;
      }

      if (reservation.test_date !== dateText) {
        return total;
      }

      return total + Number(reservation.credit_count);
    }, 0);
  }

  function isDateUnavailable(dateText) {
    if (isOutsideBookingWindow(dateText)) {
      return true;
    }

    const selectedGradeIsSenior =
      formData.gradeLevel === 11 || formData.gradeLevel === 12;

    const sameDayReservations = reservationList.filter(
      (reservation) => reservation.test_date === dateText
    );

    const reservedCredits = sameDayReservations.reduce(
      (total, reservation) => total + Number(reservation.credit_count),
      0
    );

    if (reservedCredits + Number(formData.creditCount) > 1.5) {
      return true;
    }

    return sameDayReservations.some((reservation) => {
      if (Number(reservation.credit_count) !== Number(formData.creditCount)) {
        return false;
      }

      const reservationGradeIsSenior =
        reservation.grade_level === 11 || reservation.grade_level === 12;

      if (selectedGradeIsSenior && reservationGradeIsSenior) {
        return reservation.program_type === formData.programType;
      }

      return true;
    });
  }

  function isEditDateUnavailable(dateText) {
    if (isOutsideBookingWindow(dateText)) {
      return true;
    }

    const selectedGradeIsSenior =
      modalFormData.gradeLevel === 11 || modalFormData.gradeLevel === 12;

    const sameDayReservations = reservationList.filter(
      (reservation) =>
        reservation.id !== modalFormData.id && reservation.test_date === dateText
    );

    const reservedCredits = sameDayReservations.reduce(
      (total, reservation) => total + Number(reservation.credit_count),
      0
    );

    if (reservedCredits + Number(modalFormData.creditCount) > 1.5) {
      return true;
    }

    return sameDayReservations.some((reservation) => {
      if (Number(reservation.credit_count) !== Number(modalFormData.creditCount)) {
        return false;
      }

      const reservationGradeIsSenior =
        reservation.grade_level === 11 || reservation.grade_level === 12;

      if (selectedGradeIsSenior && reservationGradeIsSenior) {
        return reservation.program_type === modalFormData.programType;
      }

      return true;
    });
  }

  function validateMainForm() {
    const errors = {};

    if (!formData.testDate) {
      errors.testDate = "Please select a date";
    }

    if (!formData.subjectName.trim()) {
      errors.subjectName = "Subject is required";
    }

    if (!Number.isInteger(Number(formData.gradeLevel))) {
      errors.gradeLevel = "Grade must be a number";
    } else if (Number(formData.gradeLevel) < 1 || Number(formData.gradeLevel) > 12) {
      errors.gradeLevel = "Grade must be between 1 and 12";
    }

    if ((formData.gradeLevel === 11 || formData.gradeLevel === 12) && !formData.programType) {
      errors.programType = "Please select High School or IB";
    }

    if (!formData.testType) {
      errors.testType = "Please select a test type";
    }

    const mainCredits = Number(formData.creditCount);

    if (Number.isNaN(mainCredits)) {
      errors.creditCount = "Credits must be a number";
    } else if (mainCredits < 0.5 || mainCredits > 1) {
      errors.creditCount = "Credits must be between 0.5 and 1";
    }

    if (formData.testDate && isOutsideBookingWindow(formData.testDate)) {
      errors.testDate = "Date must be within the booking window";
    }

    if (
      formData.testDate &&
      !errors.testDate &&
      !errors.creditCount &&
      getReservedCreditsForDay(formData.testDate) + mainCredits > 1.5
    ) {
      errors.testDate = "This day has reached the maximum total of 1.5 credits";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateModalForm() {
    const errors = {};

    if (!modalFormData.testDate) {
      errors.testDate = "Please select a date";
    }

    if (!modalFormData.subjectName.trim()) {
      errors.subjectName = "Subject is required";
    }

    if (!Number.isInteger(Number(modalFormData.gradeLevel))) {
      errors.gradeLevel = "Grade must be a number";
    } else if (Number(modalFormData.gradeLevel) < 1 || Number(modalFormData.gradeLevel) > 12) {
      errors.gradeLevel = "Grade must be between 1 and 12";
    }

    if (
      (modalFormData.gradeLevel === 11 || modalFormData.gradeLevel === 12) &&
      !modalFormData.programType
    ) {
      errors.programType = "Please select High School or IB";
    }

    if (!modalFormData.testType) {
      errors.testType = "Please select a test type";
    }

    const modalCredits = Number(modalFormData.creditCount);

    if (Number.isNaN(modalCredits)) {
      errors.creditCount = "Credits must be a number";
    } else if (modalCredits < 0.5 || modalCredits > 1) {
      errors.creditCount = "Credits must be between 0.5 and 1";
    }

    if (modalFormData.testDate && isOutsideBookingWindow(modalFormData.testDate)) {
      errors.testDate = "Date must be within the booking window";
    }

    if (
      modalFormData.testDate &&
      !errors.testDate &&
      !errors.creditCount &&
      getReservedCreditsForEditDay(modalFormData.testDate) + modalCredits > 1.5
    ) {
      errors.testDate = "This day has reached the maximum total of 1.5 credits";
    }

    if (modalFormData.testDate && !errors.testDate && isEditDateUnavailable(modalFormData.testDate)) {
      errors.testDate = "This date is unavailable for the selected credits";
    }

    setModalValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleReservation() {
    setErrorMessage("");

    if (!validateMainForm()) {
      return;
    }

    try {
      const response = await sendApiRequest("/reservations", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          creditCount: Number(formData.creditCount)
        })
      });

      setReservationList((currentList) =>
        [...currentList, response.reservation].sort((firstItem, secondItem) =>
          firstItem.test_date.localeCompare(secondItem.test_date)
        )
      );

      setValidationErrors({});
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function openReservationModal(reservationId) {
    const reservation = reservationList.find(
      (currentReservation) => currentReservation.id === Number(reservationId)
    );

    if (!reservation) {
      return;
    }

    setSelectedReservation(reservation);
    setModalFormData({
      id: reservation.id,
      testDate: reservation.test_date,
      subjectName: reservation.subject_name,
      gradeLevel: reservation.grade_level,
      programType: reservation.program_type || "",
      testType: reservation.test_type || "summative",
      creditCount: reservation.credit_count
    });
    setModalValidationErrors({});
    setIsEditMode(false);
  }

  function closeReservationModal() {
    setSelectedReservation(null);
    setIsEditMode(false);
    setModalValidationErrors({});
    setIsEditSubjectModalOpen(false);
  }

  async function handleUpdateReservation() {
    if (!validateModalForm()) {
      return;
    }

    try {
      const response = await sendApiRequest(`/reservations/${modalFormData.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...modalFormData,
          creditCount: Number(modalFormData.creditCount)
        })
      });

      setReservationList((currentList) =>
        currentList.map((reservation) =>
          reservation.id === response.reservation.id ? response.reservation : reservation
        )
      );

      setSelectedReservation(response.reservation);
      setIsEditMode(false);
      setModalValidationErrors({});
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleDeleteReservation(reservationId) {
    const shouldDelete = window.confirm("Are you sure you want to delete this reservation?");

    if (!shouldDelete) {
      return;
    }

    setErrorMessage("");

    try {
      await sendApiRequest(`/reservations/${reservationId}`, {
        method: "DELETE"
      });

      setReservationList((currentList) =>
        currentList.filter((reservation) => reservation.id !== Number(reservationId))
      );

      closeReservationModal();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function getLocalDateText(dateValue) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, "0");
    const day = String(dateValue.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function selectSubjectForMainForm(subjectName) {
    setFormData((currentData) => ({
      ...currentData,
      subjectName
    }));
    setValidationErrors((currentErrors) => ({
      ...currentErrors,
      subjectName: ""
    }));
    setIsSubjectModalOpen(false);
  }

  function selectSubjectForEditForm(subjectName) {
    setModalFormData((currentData) => ({
      ...currentData,
      subjectName
    }));
    setModalValidationErrors((currentErrors) => ({
      ...currentErrors,
      subjectName: ""
    }));
    setIsEditSubjectModalOpen(false);
  }

  return (
    <div className="dashboardPage">
      <div className="dashboardTop">
        <div>
          <h1 className="pageTitle">Test Reservation Calendar</h1>
          <p className="pageText">
            {teacher ? `Logged in as ${teacher.username}` : "Loading..."}
          </p>

          {bookingWindow && (
            <div className="windowBox">
              Booking window: {bookingWindow.firstAllowedDate} to {bookingWindow.lastAllowedDate}
            </div>
          )}
        </div>

        <button className="secondaryButton" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {errorMessage && <div className="errorBox">{errorMessage}</div>}

      <div className="mainGrid">
        <div className="cardBox">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "title",
              center: "",
              right: "today prev,next"
            }}
            fixedWeekCount={true}
            showNonCurrentDates={true}
            dayMaxEventRows={2}
            events={calendarEvents}
            height="auto"
            dateClick={(info) => {
              if (isDateUnavailable(info.dateStr)) {
                if (isOutsideBookingWindow(info.dateStr)) {
                  setErrorMessage("This date is outside the booking window.");
                } else {
                  setErrorMessage("This date is unavailable for the selected credits or exceeds 1.5 total credits.");
                }
                return;
              }

              setErrorMessage("");
              setValidationErrors((currentErrors) => ({
                ...currentErrors,
                testDate: ""
              }));

              setFormData((currentData) => ({
                ...currentData,
                testDate: info.dateStr
              }));
            }}
            eventClick={(info) => {
              openReservationModal(info.event.id);
            }}
            dayCellClassNames={(dayInfo) => {
              const dateText = getLocalDateText(dayInfo.date);
              const classNames = [];

              if (isOutsideBookingWindow(dateText)) {
                classNames.push("calendarDayDisabled");
              }

              if (formData.testDate === dateText) {
                classNames.push("calendarDaySelected");
              }

              return classNames;
            }}
          />

          <p className="calendarHelpText">
            Dimmed dates are outside the booking window. Each day can have a maximum total of 1.5 credits.
          </p>
        </div>

        <div className="cardBox formCard">
          <h2 className="cardTitle">Reserve a Test</h2>
          <p className="cardText">Click a date on the calendar, then confirm the booking.</p>

          <div className="formBox">
            <label className="inputLabel">Date</label>
            <input
              className="textInput"
              type="date"
              value={formData.testDate}
              min={bookingWindow?.firstAllowedDate || ""}
              max={bookingWindow?.lastAllowedDate || ""}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  testDate: event.target.value
                })
              }
            />
            {validationErrors.testDate && (
              <div className="validationText">{validationErrors.testDate}</div>
            )}

            <label className="inputLabel">Subject</label>
            <button
              type="button"
              className="subjectPickerButton"
              onClick={() => setIsSubjectModalOpen(true)}
            >
              <span>{formData.subjectName || "Select subject"}</span>
              <span className="subjectPickerIcon">⌕</span>
            </button>
            {validationErrors.subjectName && (
              <div className="validationText">{validationErrors.subjectName}</div>
            )}

            <label className="inputLabel">Grade</label>
            <input
              className="textInput"
              type="number"
              min="1"
              max="12"
              value={formData.gradeLevel}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  gradeLevel: Number(event.target.value),
                  programType: ""
                })
              }
            />
            {validationErrors.gradeLevel && (
              <div className="validationText">{validationErrors.gradeLevel}</div>
            )}

            {(formData.gradeLevel === 11 || formData.gradeLevel === 12) && (
              <>
                <label className="inputLabel">Program</label>
                <select
                  className="textInput"
                  value={formData.programType}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      programType: event.target.value
                    })
                  }
                >
                  <option value="">Select program</option>
                  <option value="High School">High School</option>
                  <option value="IB">IB</option>
                </select>
                {validationErrors.programType && (
                  <div className="validationText">{validationErrors.programType}</div>
                )}
              </>
            )}

            <label className="inputLabel">Type of Test</label>
            <select
              className="textInput"
              value={formData.testType}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  testType: event.target.value
                })
              }
            >
              <option value="summative">Summative</option>
              <option value="formative">Formative</option>
            </select>
            {validationErrors.testType && (
              <div className="validationText">{validationErrors.testType}</div>
            )}

            <label className="inputLabel">Credits</label>
            <input
              className="textInput"
              type="number"
              min="0.5"
              max="1"
              step="0.5"
              value={formData.creditCount}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  creditCount: Number(event.target.value)
                })
              }
            />
            {validationErrors.creditCount && (
              <div className="validationText">{validationErrors.creditCount}</div>
            )}

            <button
              className="mainButton"
              onClick={handleReservation}
              disabled={!formData.testDate || isDateUnavailable(formData.testDate)}
            >
              Reserve
            </button>
          </div>

          <p className="formHelpText">
            Rule: credits must be between 0.5 and 1, each day can only have 1.5 credits in total, and each reservation must have a test type.
          </p>
        </div>
      </div>

      {selectedReservation && (
        <div className="modalOverlay" onClick={closeReservationModal}>
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2 className="modalTitle">Reservation Details</h2>
                <p className="modalText">View or update this test reservation.</p>
              </div>

              <div className="modalActions">
                {isOwnReservation ? (
                  <>
                    <button
                      className="iconButton"
                      onClick={() => setIsEditMode(true)}
                      title="Edit"
                    >
                      ✏️
                    </button>

                    <button
                      className="iconButton deleteButton"
                      onClick={() => handleDeleteReservation(selectedReservation.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </>
                ) : (
                  <div className="modalOwnerNote">Read only</div>
                )}

                <button className="iconButton" onClick={closeReservationModal} title="Close">
                  ✕
                </button>
              </div>
            </div>

            <div className="formBox modalFormBox">
              <label className="inputLabel">Date</label>
              <input
                className="textInput"
                type="date"
                value={modalFormData.testDate}
                min={bookingWindow?.firstAllowedDate || ""}
                max={bookingWindow?.lastAllowedDate || ""}
                disabled={!isEditMode}
                onChange={(event) =>
                  setModalFormData({
                    ...modalFormData,
                    testDate: event.target.value
                  })
                }
              />
              {modalValidationErrors.testDate && (
                <div className="validationText">{modalValidationErrors.testDate}</div>
              )}

              <label className="inputLabel">Subject</label>
              {isEditMode ? (
                <button
                  type="button"
                  className="subjectPickerButton"
                  onClick={() => setIsEditSubjectModalOpen(true)}
                >
                  <span>{modalFormData.subjectName || "Select subject"}</span>
                  <span className="subjectPickerIcon">⌕</span>
                </button>
              ) : (
                <input
                  className="textInput"
                  value={modalFormData.subjectName}
                  disabled
                  readOnly
                />
              )}
              {modalValidationErrors.subjectName && (
                <div className="validationText">{modalValidationErrors.subjectName}</div>
              )}

              <label className="inputLabel">Grade</label>
              <input
                className="textInput"
                type="number"
                min="1"
                max="12"
                value={modalFormData.gradeLevel}
                disabled={!isEditMode}
                onChange={(event) =>
                  setModalFormData({
                    ...modalFormData,
                    gradeLevel: Number(event.target.value),
                    programType: ""
                  })
                }
              />
              {modalValidationErrors.gradeLevel && (
                <div className="validationText">{modalValidationErrors.gradeLevel}</div>
              )}

              {(modalFormData.gradeLevel === 11 || modalFormData.gradeLevel === 12) && (
                <>
                  <label className="inputLabel">Program</label>
                  <select
                    className="textInput"
                    value={modalFormData.programType}
                    disabled={!isEditMode}
                    onChange={(event) =>
                      setModalFormData({
                        ...modalFormData,
                        programType: event.target.value
                      })
                    }
                  >
                    <option value="">Select program</option>
                    <option value="High School">High School</option>
                    <option value="IB">IB</option>
                  </select>
                  {modalValidationErrors.programType && (
                    <div className="validationText">{modalValidationErrors.programType}</div>
                  )}
                </>
              )}

              <label className="inputLabel">Type of Test</label>
              <select
                className="textInput"
                value={modalFormData.testType}
                disabled={!isEditMode}
                onChange={(event) =>
                  setModalFormData({
                    ...modalFormData,
                    testType: event.target.value
                  })
                }
              >
                <option value="summative">Summative</option>
                <option value="formative">Formative</option>
              </select>
              {modalValidationErrors.testType && (
                <div className="validationText">{modalValidationErrors.testType}</div>
              )}

              <label className="inputLabel">Credits</label>
              <input
                className="textInput"
                type="number"
                min="0.5"
                max="1"
                step="0.5"
                value={modalFormData.creditCount}
                disabled={!isEditMode}
                onChange={(event) =>
                  setModalFormData({
                    ...modalFormData,
                    creditCount: Number(event.target.value)
                  })
                }
              />
              {modalValidationErrors.creditCount && (
                <div className="validationText">{modalValidationErrors.creditCount}</div>
              )}

              <label className="inputLabel">Teacher</label>
              <input
                className="textInput"
                value={selectedReservation.username}
                disabled
                readOnly
              />

              {isEditMode && (
                <div className="modalBottomButtons">
                  <button className="mainButton" onClick={handleUpdateReservation}>
                    Save Changes
                  </button>
                  <button
                    className="secondaryButton"
                    onClick={() => {
                      setIsEditMode(false);
                      setModalValidationErrors({});
                      setIsEditSubjectModalOpen(false);
                      setModalFormData({
                        id: selectedReservation.id,
                        testDate: selectedReservation.test_date,
                        subjectName: selectedReservation.subject_name,
                        gradeLevel: selectedReservation.grade_level,
                        programType: selectedReservation.program_type || "",
                        testType: selectedReservation.test_type || "summative",
                        creditCount: selectedReservation.credit_count
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isSubjectModalOpen && (
        <div className="modalOverlay" onClick={() => setIsSubjectModalOpen(false)}>
          <div className="subjectModalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2 className="modalTitle">Select Subject</h2>
                <p className="modalText">Search, filter, or sort the subject list.</p>
              </div>

              <button
                className="iconButton"
                onClick={() => setIsSubjectModalOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="subjectToolsRow">
              <input
                className="textInput"
                placeholder="Search subjects..."
                value={subjectSearchText}
                onChange={(event) => setSubjectSearchText(event.target.value)}
              />

              <select
                className="textInput subjectToolSelect"
                value={subjectCategoryFilter}
                onChange={(event) => setSubjectCategoryFilter(event.target.value)}
              >
                <option value="All">All categories</option>
                <option value="IB">IB</option>
                <option value="MYP">MYP</option>
                <option value="General">General</option>
                <option value="Section 1">Section 1</option>
              </select>

              <select
                className="textInput subjectToolSelect"
                value={subjectSortOption}
                onChange={(event) => setSubjectSortOption(event.target.value)}
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="category">Category</option>
              </select>
            </div>

            <div className="subjectListBox">
              {filteredSubjectOptions.map((subject) => (
                <button
                  key={`${subject.category}-${subject.name}`}
                  className="subjectOptionButton"
                  onClick={() => selectSubjectForMainForm(subject.name)}
                >
                  <div className="subjectOptionName">{subject.name}</div>
                  <div className="subjectOptionMeta">
                    <span>{subject.category}</span>
                  </div>
                </button>
              ))}

              {filteredSubjectOptions.length === 0 && (
                <div className="emptySubjectText">No subjects found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditSubjectModalOpen && (
        <div className="modalOverlay" onClick={() => setIsEditSubjectModalOpen(false)}>
          <div className="subjectModalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalTop">
              <div>
                <h2 className="modalTitle">Select Subject</h2>
                <p className="modalText">Search, filter, or sort the subject list.</p>
              </div>

              <button
                className="iconButton"
                onClick={() => setIsEditSubjectModalOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="subjectToolsRow">
              <input
                className="textInput"
                placeholder="Search subjects..."
                value={editSubjectSearchText}
                onChange={(event) => setEditSubjectSearchText(event.target.value)}
              />

              <select
                className="textInput subjectToolSelect"
                value={editSubjectCategoryFilter}
                onChange={(event) => setEditSubjectCategoryFilter(event.target.value)}
              >
                <option value="All">All categories</option>
                <option value="IB">IB</option>
                <option value="MYP">MYP</option>
                <option value="General">General</option>
              </select>

              <select
                className="textInput subjectToolSelect"
                value={editSubjectSortOption}
                onChange={(event) => setEditSubjectSortOption(event.target.value)}
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="category">Category</option>
              </select>
            </div>

            <div className="subjectListBox">
              {filteredEditSubjectOptions.map((subject) => (
                <button
                  key={`${subject.category}-${subject.name}`}
                  className="subjectOptionButton"
                  onClick={() => selectSubjectForEditForm(subject.name)}
                >
                  <div className="subjectOptionName">{subject.name}</div>
                  <div className="subjectOptionMeta">
                    <span>{subject.category}</span>
                  </div>
                </button>
              ))}

              {filteredEditSubjectOptions.length === 0 && (
                <div className="emptySubjectText">No subjects found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}