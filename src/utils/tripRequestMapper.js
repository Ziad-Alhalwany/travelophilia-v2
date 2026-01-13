// src/utils/tripRequestMapper.js

const joinPhone = (dialCode, local) => {
  const d = (dialCode ?? "").toString().trim();
  const l = (local ?? "").toString().trim();
  if (!d && !l) return "";
  if (d && !l) return d;
  if (!d && l) return l;
  return `${d}${l}`;
};

const pick = (obj, keys, fallback = undefined) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined) return obj[k];
  }
  return fallback;
};

export const mapTripRequestPayload = (form = {}) => {
  // ✅ نقبل camelCase أو snake_case (احتياط)
  const fullName = pick(form, ["fullName", "leaderFullName", "leader_full_name"], "");
  const dialCode = pick(form, ["dialCode", "dial_code"], "");
  const phoneLocal = pick(form, ["phoneLocal", "phone_local"], "");
  const whatsappDialCode = pick(form, ["whatsappDialCode", "whatsapp_dial_code"], "");
  const whatsappLocal = pick(form, ["whatsappLocal", "whatsapp_local"], "");

  const email = pick(form, ["email", "leaderEmail", "leader_email"], "");
  const gender = pick(form, ["gender", "leaderGender", "leader_gender"], "");
  const age = pick(form, ["age", "leaderAge", "leader_age"], null);

  const nationality = pick(form, ["nationality", "leaderNationality", "leader_nationality"], "");
  const residentCountry = pick(
    form,
    ["residentCountry", "leaderResidentCountry", "leader_resident_country"],
    ""
  );

  const identityType = pick(
    form,
    ["identityType", "leaderIdentityType", "leader_identity_type"],
    ""
  );
  const identityLast4 = pick(
    form,
    ["identityLast4", "leaderIdentityLast4", "leader_identity_last4"],
    ""
  );

  const entryTypeForEgypt = pick(form, ["entryTypeForEgypt", "entry_type_for_egypt"], "");

  const adultsCount = pick(form, ["adultsCount", "adults_count"], 1);
  const childrenCount = pick(form, ["childrenCount", "children_count"], 0);
  const paxTotal = pick(form, ["paxTotal", "pax_total"], undefined);

  const safeAdults = Number.isFinite(+adultsCount) ? Math.max(0, parseInt(adultsCount, 10)) : 0;
  const safeChildren = Number.isFinite(+childrenCount)
    ? Math.max(0, parseInt(childrenCount, 10))
    : 0;
  const safePaxTotal = Number.isFinite(+paxTotal)
    ? Math.max(0, parseInt(paxTotal, 10))
    : safeAdults + safeChildren;

  const safeAge =
    age === "" || age === null || age === undefined ? null : Math.max(0, parseInt(age, 10));

  // ✅ خريطة حقول الـ TripRequest الأساسية (camel -> snake)
  const out = {
    trip_code_in: pick(form, ["tripCode_in", "trip_code_in"], ""),
    trip_slug_in: pick(form, ["tripSlug_in", "trip_slug_in"], ""),
    trip_title_in: pick(form, ["tripTitle_in", "trip_title_in"], ""),

    origin_city: pick(form, ["originCity", "origin_city"], ""),
    destination_city: pick(form, ["destinationCity", "destination_city"], ""),

    depart_date: pick(form, ["departDate", "depart_date"], ""),
    return_date: pick(form, ["returnDate", "return_date"], ""),

    couples_answer: pick(form, ["couplesAnswer", "couples_answer"], "NO"),
    terms_accepted: Boolean(pick(form, ["termsAccepted", "terms_accepted"], false)),
    docs_acknowledged: Boolean(pick(form, ["docsAcknowledged", "docs_acknowledged"], false)),

    note: pick(form, ["note"], ""),
  };

  // ✅ leader_* (snake) + counts (snake)
  out.leader_full_name = (fullName ?? "").toString().trim();
  out.leader_phone = joinPhone(dialCode, phoneLocal);
  out.leader_whatsapp = joinPhone(whatsappDialCode, whatsappLocal);
  out.leader_email = (email ?? "").toString().trim();
  out.leader_gender = gender ?? "";
  out.leader_age = safeAge;

  out.leader_nationality = nationality ?? "";
  out.leader_resident_country = residentCountry ?? "";
  out.leader_identity_type = identityType ?? "";
  out.leader_identity_last4 = (identityLast4 ?? "").toString().trim();
  out.entry_type_for_egypt = entryTypeForEgypt ?? "";

  out.adults_count = safeAdults;
  out.children_count = safeChildren;
  out.pax_total = safePaxTotal;

  return out;
};
