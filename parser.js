function parseHl7Case(message) {
  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const segments = lines.map((line) => line.split("|"));

  const getFirst = (name) => segments.find((segment) => segment[0] === name) || [];
  const getAll = (name) => segments.filter((segment) => segment[0] === name);

  // HL7 gotcha:
  // MSH is offset by one because MSH-1 is the field separator, not a normal pipe field.
  const getField = (segment, fieldNumber) => {
    if (!segment || segment.length === 0) return "";
    if (segment[0] === "MSH") return segment[fieldNumber - 1] ?? "";
    return segment[fieldNumber] ?? "";
  };

  const getComponent = (fieldValue, componentNumber) => {
    const components = String(fieldValue || "").split("^");
    return components[componentNumber - 1] ?? "";
  };

  const clean = (value) => {
    const trimmed = String(value ?? "").trim();
    return trimmed === "" ? null : trimmed;
  };

  const msh = getFirst("MSH");
  const sch = getFirst("SCH");
  const ais = getFirst("AIS");
  const ail = getFirst("AIL");
  const aipSegments = getAll("AIP");
  const nteSegments = getAll("NTE");

  const primaryAip =
    aipSegments.find(
      (aip) => getComponent(getField(aip, 4), 2).toLowerCase() === "primary"
    ) ||
    aipSegments[0] ||
    [];

  const procedureNte =
    nteSegments.find((nte) => clean(getField(nte, 4)) === "Procedure Description") ||
    [];

  const parseSurgerySides = (aisSegment) => {
    const rawField = getField(aisSegment, 12);
    if (!rawField) return [];

    return rawField
      .split("~")
      .map((repetition) => clean(getComponent(repetition, 2)))
      .filter(Boolean);
  };

  const parseImplant = (nteSegment) => {
    const rawText = String(getField(nteSegment, 3) || "");
    const body = rawText.replace(/^IMPLANT:\s*/i, "").trim();

    // Find where the description stops
    const qtyStart = body.search(/(^|\s-\s|^-\s*)Qty:/i);
    const lotStart = body.search(/(^|\s-\s|^-\s*)LOT:/i);
    const markerStarts = [qtyStart, lotStart].filter((index) => index >= 0);
    const descEnd = markerStarts.length ? Math.min(...markerStarts) : body.length;

    const description = clean(body.slice(0, descEnd).replace(/^-+\s*/, "").trim());
    const quantityText = clean((body.match(/Qty:\s*([^\-]+?)(?=\s-\sLOT:|$)/i) || [])[1]);
    const lotNumber = clean((body.match(/LOT:\s*(.*)$/i) || [])[1]);

    const quantity = /^\d+$/.test(quantityText || "") ? Number(quantityText) : null;

    // My assumption:
    // an implant row is "parseError" if any required implant field is missing or invalid.
    const parseError = !description || !quantityText || quantity === null || !lotNumber;

    const implant = {
      description,
      quantity,
      lotNumber,
      requiresReview: Number.isInteger(quantity) && quantity > 2,
    };

    if (parseError) {
      implant.parseError = true;
    }

    return implant;
  };

  const isImplantNte = (nte) =>
    /^IMPLANT:/i.test(String(getField(nte, 3) || "").trim());

  const isProcedureNte = (nte) =>
    clean(getField(nte, 4)) === "Procedure Description";

  const implants = nteSegments.filter(isImplantNte).map(parseImplant);

  const unrecognizedNteCount = nteSegments.filter(
    (nte) => !isImplantNte(nte) && !isProcedureNte(nte)
  ).length;

  return {
    scheduling: clean(getComponent(getField(sch, 25), 2)),
    caseId: clean(getField(sch, 2)),
    hospitalId: clean(getField(msh, 4)),
    surgeryLocation: clean(getComponent(getField(ail, 3), 4)),
    operatingRoom: clean(getComponent(getField(ail, 3), 2)),
    surgeonId: clean(getComponent(getField(primaryAip, 3), 1)),
    surgeonGivenName: clean(getComponent(getField(primaryAip, 3), 3)),
    surgeonFamilyName: clean(getComponent(getField(primaryAip, 3), 2)),
    surgerySides: parseSurgerySides(ais),
    surgeryDateTime: clean(getField(ais, 4)),
    procedureType: clean(getComponent(getField(ais, 3), 2)),
    procedureDescription: clean(getField(procedureNte, 3)),
    implants,
    meta: {
      totalImplants: implants.length,
      unrecognizedNteCount,
    },
  };
}

module.exports = { parseHl7Case };
