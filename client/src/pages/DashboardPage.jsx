import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { sendApiRequest } from "../api.js";

const subjectOptions = [
  { name: "Arabic B IB HL", category: "IB", gradeGroup: "11-12" },
  { name: "Business Manag. IB HL", category: "IB", gradeGroup: "11-12" },
  { name: "Computer Science", category: "General", gradeGroup: "All" },
  { name: "Economics IB HL", category: "IB", gradeGroup: "11-12" },
  { name: "English Lang-Lit IB SL", category: "IB", gradeGroup: "11-12" },
  { name: "Islamic Studies 11 IB", category: "IB", gradeGroup: "11" },
  { name: "Math Applications & Int. 11 IB SL", category: "IB", gradeGroup: "11" },
  { name: "PE Boys", category: "General", gradeGroup: "All" },
  { name: "Theory of Knowledge", category: "IB", gradeGroup: "11-12" },
  { name: "National-Social Studies", category: "General", gradeGroup: "All" },
  { name: "Arabic Acquisition MYP", category: "MYP", gradeGroup: "MYP" },
  { name: "Arabic literature MYP", category: "MYP", gradeGroup: "MYP" },
  { name: "English Lang-Lit MYP", category: "MYP", gradeGroup: "MYP" },
  { name: "Homeroom Secondary School1_HRSS", category: "Section 1", gradeGroup: "Section 1" },
  { name: "Integrated Humanities MYP 10", category: "MYP", gradeGroup: "10" },
  { name: "Integrated Science MYP 10", category: "MYP", gradeGroup: "10" },
  { name: "Islamic Studies 10", category: "MYP", gradeGroup: "10" },
  { name: "Mathematics MYP 10", category: "MYP", gradeGroup: "10" },
  { name: "PE 10 Boys", category: "MYP", gradeGroup: "10" },
  { name: "Theatre MYP 10", category: "MYP", gradeGroup: "10" },
  { name: "Arabic Acquisition MYP 9", category: "MYP", gradeGroup: "9" },
  { name: "Biology MYP", category: "MYP", gradeGroup: "MYP" },
  { name: "Chemistry & Physics MYP", category: "MYP", gradeGroup: "MYP" },
  { name: "English Lang-Lit MYP 9", category: "MYP", gradeGroup: "9" },
  { name: "Integrated Humanities MYP", category: "MYP", gradeGroup: "MYP" },
  { name: "Islamic Studies", category: "General", gradeGroup: "All" },
  { name: "Mathematics MYP", category: "MYP", gradeGroup: "MYP" },
  { name: "PE", category: "General", gradeGroup: "All" },
  { name: "Theatre MYP", category: "MYP", gradeGroup: "MYP" }
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
    creditCount: 3
  });

  const [modalFormData, setModalFormData] = useState({
    id: null,
    testDate: "",
    subjectName: "",
    gradeLevel: 10,
    programType: "",
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
        subject.category.toLowerCase().includes(normalizedSearchText) ||
        subject.gradeGroup.toLowerCase().includes(normalizedSearchText)
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

    if (subjectSortOption === "grade-group") {
      list.sort((firstItem, secondItem) => {
        const gradeCompare = firstItem.gradeGroup.localeCompare(secondItem.gradeGroup);
        if (gradeCompare !== 0) {
          return gradeCompare;
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
        subject.category.toLowerCase().includes(normalizedSearchText) ||
        subject.gradeGroup.toLowerCase().includes(normalizedSearchText)
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

    if (editSubjectSortOption === "grade-group") {
      list.sort((firstItem, secondItem) => {
        const gradeCompare = firstItem.gradeGroup.localeCompare(secondItem.gradeGroup);
        if (gradeCompare !== 0) {
          return gradeCompare;
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

  function isDateUnavailable(dateText) {
    if (isOutsideBookingWindow(dateText)) {
      return true;
    }

    const selectedGradeIsSenior =
      formData.gradeLevel === 11 || formData.gradeLevel === 12;

    return reservationList.some((reservation) => {
      if (reservation.test_date !== dateText) {
        return false;
      }

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

    return reservationList.some((reservation) => {
      if (reservation.id === modalFormData.id) {
        return false;
      }

      if (reservation.test_date !== dateText) {
        return false;
      }

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

    if (!Number.isInteger(Number(formData.creditCount)) || Number(formData.creditCount) < 1) {
      errors.creditCount = "Credits must be at least 1";
    }

    if (formData.testDate && isOutsideBookingWindow(formData.testDate)) {
      errors.testDate = "Date must be within the booking window";
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

    if (
      !Number.isInteger(Number(modalFormData.creditCount)) ||
      Number(modalFormData.creditCount) < 1
    ) {
      errors.creditCount = "Credits must be at least 1";
    }

    if (modalFormData.testDate && isOutsideBookingWindow(modalFormData.testDate)) {
      errors.testDate = "Date must be within the booking window";
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
        body: JSON.stringify(formData)
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
        body: JSON.stringify(modalFormData)
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
                  setErrorMessage("This date is unavailable for the selected credits.");
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
            Dimmed dates are outside the booking window. Existing test cards on a day show that it is already booked.
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

            <label className="inputLabel">Credits</label>
            <input
              className="textInput"
              type="number"
              min="1"
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
            Rule: two tests with the same credits cannot be booked on the same day. For grades 11 and 12, High School and IB can share the same day.
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

              <label className="inputLabel">Credits</label>
              <input
                className="textInput"
                type="number"
                min="1"
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
                <option value="grade-group">Grade group</option>
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
                    <span>{subject.gradeGroup}</span>
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
                <option value="Section 1">Section 1</option>
              </select>

              <select
                className="textInput subjectToolSelect"
                value={editSubjectSortOption}
                onChange={(event) => setEditSubjectSortOption(event.target.value)}
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="category">Category</option>
                <option value="grade-group">Grade group</option>
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
                    <span>{subject.gradeGroup}</span>
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