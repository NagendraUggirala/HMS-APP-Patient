import { PATIENT_APPOINTMENT_BOOKING_BASE } from '../config/api'
import { apiFetch } from './apiClient'

/**
 * Helper for protected patient APIs. Adds Authorization: Bearer <access_token>.
 * Uses the shared refresh-retry behavior from apiFetch on 401 responses.
 */
export async function patientApiFetch(path, options = {}) {
  return apiFetch(path, options)
}

const PAB = PATIENT_APPOINTMENT_BOOKING_BASE

export function patientAppointmentErrorMessage(payload) {
  const d = payload?.detail
  if (typeof d === 'string') return d
  if (d && typeof d === 'object' && !Array.isArray(d) && d.message) return d.message
  if (Array.isArray(d)) return d.map((e) => e.msg || JSON.stringify(e)).join('; ')
  return payload?.message || 'Request failed'
}

export function getPatientDepartments() {
  return patientApiFetch(`${PAB}/departments`)
}

export function getPatientDepartmentDoctors(departmentName) {
  return patientApiFetch(`${PAB}/departments/${encodeURIComponent(departmentName)}/doctors`)
}

export function getDoctorAvailableSlots(doctorName, date) {
  const q = new URLSearchParams({ date })
  return patientApiFetch(`${PAB}/doctors/${encodeURIComponent(doctorName)}/available-slots?${q}`)
}

export function bookPatientAppointment(body) {
  return patientApiFetch(`${PAB}/book-appointment`, { method: 'POST', body })
}

export function getPatientAppointmentByRef(appointmentRef) {
  return patientApiFetch(`${PAB}/appointment/${encodeURIComponent(appointmentRef)}`)
}

export function getMyPatientAppointments({ page = 1, limit = 10, statusFilter } = {}) {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (statusFilter) q.set('status_filter', statusFilter)
  return patientApiFetch(`${PAB}/my-appointments?${q}`)
}

export function cancelPatientAppointment(appointmentRef, cancellationReason) {
  return patientApiFetch(`${PAB}/appointment/${encodeURIComponent(appointmentRef)}/cancel`, {
    method: 'PATCH',
    body: { cancellation_reason: cancellationReason },
  })
}
