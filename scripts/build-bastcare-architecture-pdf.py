#!/usr/bin/env python3
"""Build BastCare's public, downloadable solution architecture."""

from pathlib import Path
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "bastcare-solution-architecture.pdf"

PAGE_W, PAGE_H = landscape(letter)
INK = HexColor("#0D2935")
MUTED = HexColor("#4A6470")
ACCENT = HexColor("#0090CC")
SECONDARY = HexColor("#3C54A1")
BG = HexColor("#DDE3E9")
PANEL = HexColor("#F6F9FB")
LINE = HexColor("#B9C8CF")
PALE_BLUE = HexColor("#E8F6FC")
PALE_VIOLET = HexColor("#EEF0FA")
PALE_GREEN = HexColor("#E9F6F1")
GREEN = HexColor("#147A63")
WARM = HexColor("#F8F0E8")
ORANGE = HexColor("#A84B12")


def wrap(text, font, size, max_width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def text_block(c, text, x, y, width, size=11, leading=15, font="Helvetica", color=INK, max_lines=None):
    c.setFont(font, size)
    c.setFillColor(color)
    lines = wrap(text, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def page_base(c, page_no, section):
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 8, PAGE_W, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(38, PAGE_H - 35, "BASTCARE")
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawRightString(PAGE_W - 38, PAGE_H - 35, section)
    c.setStrokeColor(LINE)
    c.line(38, 28, PAGE_W - 38, 28)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MUTED)
    c.drawString(38, 16, "Public solution architecture  |  Version 1.0  |  August 2026")
    c.drawCentredString(PAGE_W / 2, 16, "BastCare is not a medical device.")
    c.drawRightString(PAGE_W - 38, 16, str(page_no))


def title(c, eyebrow, heading, subhead=None):
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(ACCENT)
    c.drawString(38, PAGE_H - 68, eyebrow.upper())
    c.setFont("Helvetica-Bold", 25)
    c.setFillColor(INK)
    c.drawString(38, PAGE_H - 100, heading)
    if subhead:
        text_block(c, subhead, 38, PAGE_H - 122, PAGE_W - 76, 10.5, 14, color=MUTED)


def rounded_panel(c, x, y, w, h, fill=PANEL, stroke=LINE, radius=12):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.7)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def card(c, x, y, w, h, label, heading, body, fill=PANEL, accent=ACCENT):
    rounded_panel(c, x, y, w, h, fill=fill)
    c.setFillColor(accent)
    c.roundRect(x, y, 5, h, 3, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(accent)
    c.drawString(x + 16, y + h - 22, label.upper())
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(INK)
    c.drawString(x + 16, y + h - 43, heading)
    text_block(c, body, x + 16, y + h - 62, w - 31, 9.2, 12.5, color=MUTED)


def node(c, x, y, w, h, heading, body, fill=PANEL, accent=ACCENT):
    rounded_panel(c, x, y, w, h, fill=fill, stroke=accent)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(INK)
    c.drawCentredString(x + w / 2, y + h - 22, heading)
    lines = wrap(body, "Helvetica", 8.3, w - 20)
    c.setFont("Helvetica", 8.3)
    c.setFillColor(MUTED)
    ty = y + h - 39
    for line in lines[:4]:
        c.drawCentredString(x + w / 2, ty, line)
        ty -= 11


def arrow(c, x1, y1, x2, y2, label=None, color=ACCENT, dashed=False):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.5)
    if dashed:
        c.setDash(4, 3)
    c.line(x1, y1, x2, y2)
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 6
    p1 = (x2 - size * math.cos(angle - 0.5), y2 - size * math.sin(angle - 0.5))
    p2 = (x2 - size * math.cos(angle + 0.5), y2 - size * math.sin(angle + 0.5))
    path = c.beginPath()
    path.moveTo(x2, y2)
    path.lineTo(*p1)
    path.lineTo(*p2)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    c.restoreState()
    if label:
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(color)
        c.drawCentredString((x1 + x2) / 2, (y1 + y2) / 2 + 6, label)


def step(c, number, x, y, w, heading, body, fill=PANEL):
    rounded_panel(c, x, y, w, 74, fill=fill)
    c.setFillColor(ACCENT)
    c.circle(x + 22, y + 52, 12, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(white)
    c.drawCentredString(x + 22, y + 48.5, str(number))
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(INK)
    c.drawString(x + 42, y + 54, heading)
    text_block(c, body, x + 42, y + 38, w - 54, 8.2, 10.5, color=MUTED, max_lines=3)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("BastCare Public Solution Architecture")
    c.setAuthor("Bast, Inc.")
    c.setSubject("Public architecture and privacy boundaries for BastCare")

    # 1 — Cover
    page_base(c, 1, "Architecture at a glance")
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(ACCENT)
    c.drawString(38, PAGE_H - 78, "PUBLIC RELEASE VIEW")
    c.setFont("Helvetica-Bold", 34)
    c.setFillColor(INK)
    c.drawString(38, PAGE_H - 124, "Small by design.")
    c.drawString(38, PAGE_H - 162, "Patient-controlled by default.")
    text_block(c, "A plain-language view of BastCare's system context, visit lifecycle, sharing controls, account deletion, and retained audit evidence.", 38, PAGE_H - 193, 660, 13, 18, color=MUTED)
    card(c, 38, 244, 222, 132, "01", "Temporary transcript", "Audio stays on the iPhone. Masked transcript text is sent securely to create the summary; Bast does not save or log transcript text.", fill=PALE_BLUE)
    card(c, 285, 244, 222, 132, "02", "Explicit sharing", "The patient chooses each summary and each CareTeam. Only confirmed members receive it. Sharing nothing is valid, and access can be revoked.", fill=PALE_VIOLET, accent=SECONDARY)
    card(c, 532, 244, 222, 132, "03", "Evidence, not content", "Limited audit and usage records support deletion evidence and billing transparency. They do not contain audio or transcript text.", fill=PALE_GREEN, accent=GREEN)
    rounded_panel(c, 38, 68, 716, 137, fill=INK, stroke=INK)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(white)
    c.drawString(58, 172, "The design promise")
    text_block(c, "BastCare helps a patient capture a visit, receive a plain-language summary, and choose whether to share it with trusted people. The summary is the durable record. The patient remains in control.", 58, 146, 668, 12.2, 18, color=white)
    c.showPage()

    # 2 — Context
    page_base(c, 2, "System context")
    title(c, "System context", "Who participates — and where data crosses a boundary", "Arrows show purposeful exchanges. They do not imply that every component stores the data it handles.")
    node(c, 45, 302, 136, 95, "Patient", "Records with permission, reviews the summary, and controls sharing.", fill=PALE_GREEN, accent=GREEN)
    node(c, 45, 158, 136, 95, "CareTeam member", "Accepts an invitation and sees only summaries the patient shares.", fill=PALE_VIOLET, accent=SECONDARY)
    node(c, 278, 230, 154, 105, "BastCare on iPhone", "Capture, consent, review, local data, sharing choices, and deletion controls.", fill=PALE_BLUE)
    node(c, 518, 230, 154, 105, "Bast services", "Authentication, summary orchestration, encrypted sharing relay, and audit evidence.", fill=PANEL)
    node(c, 604, 98, 150, 82, "Model-processing provider", "Processes masked text to create a summary under provider data controls.", fill=WARM, accent=ORANGE)
    node(c, 374, 82, 144, 82, "Apple services", "Sign in with Apple and device-to-device notification support.", fill=PANEL, accent=SECONDARY)
    arrow(c, 181, 349, 278, 290, "CONSENT + CONTROL", color=GREEN)
    arrow(c, 278, 252, 181, 205, "SHARED SUMMARY", color=SECONDARY)
    arrow(c, 432, 284, 518, 284, "SECURE REQUEST")
    arrow(c, 518, 258, 432, 258, "SUMMARY + STATE")
    arrow(c, 588, 230, 632, 180, "MASKED TEXT", color=ORANGE)
    arrow(c, 716, 180, 660, 230, "DRAFT SUMMARY", color=ORANGE)
    arrow(c, 540, 230, 496, 164, "IDENTITY + SIGNAL", color=SECONDARY, dashed=True)
    rounded_panel(c, 45, 50, 280, 72, fill=PANEL)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(INK)
    c.drawString(59, 98, "Trust boundary")
    text_block(c, "Visit content leaves the iPhone only for the user-requested summary and explicit sharing flow.", 59, 82, 250, 8.5, 11, color=MUTED)
    c.showPage()

    # 3 — Visit lifecycle
    page_base(c, 3, "Visit lifecycle")
    title(c, "Visit lifecycle", "From permission to a useful summary", "The lifecycle is intentionally short. Temporary material is removed when its job is done.")
    xs = [38, 286, 534]
    step(c, 1, xs[0], 330, 220, "Ask permission", "Everyone present agrees before recording begins.", fill=PALE_GREEN)
    step(c, 2, xs[1], 330, 220, "Record on iPhone", "Audio remains local while the visit is captured.", fill=PALE_BLUE)
    step(c, 3, xs[2], 330, 220, "Mask transcript text", "Direct identifiers are reduced before temporary processing.", fill=PALE_BLUE)
    step(c, 4, xs[2], 222, 220, "Create the summary", "A model-processing provider returns a plain-language draft.", fill=WARM)
    step(c, 5, xs[1], 222, 220, "Delete temporary material", "Audio and the full transcript are removed from the iPhone; Bast keeps no transcript archive.", fill=PALE_GREEN)
    step(c, 6, xs[0], 222, 220, "Review and choose", "The patient keeps the summary and may share it—or share nothing.", fill=PALE_VIOLET)
    arrow(c, 258, 367, 286, 367)
    arrow(c, 506, 367, 534, 367)
    arrow(c, 644, 330, 644, 296)
    arrow(c, 534, 259, 506, 259)
    arrow(c, 286, 259, 258, 259)
    rounded_panel(c, 38, 64, 716, 117, fill=INK, stroke=INK)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(white)
    c.drawString(56, 151, "What remains")
    text_block(c, "The visit summary, its provenance, and the patient's sharing choices. Audio and transcript text do not become a shadow health record.", 56, 130, 675, 10.5, 15, color=white)
    c.showPage()

    # 4 — Sharing and revocation
    page_base(c, 4, "Sharing and revocation")
    title(c, "Sharing and revocation", "One patient choice, one scoped result", "Sharing is summary-by-summary and CareTeam-by-CareTeam. Revocation follows the same clear path.")
    lanes = [(145, "Patient's iPhone", ACCENT), (390, "Bast sharing relay", SECONDARY), (637, "Confirmed CareTeam", GREEN)]
    for x, name, color in lanes:
        c.setFillColor(color)
        c.circle(x, 392, 7, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(INK)
        c.drawCentredString(x, 414, name)
        c.setStrokeColor(LINE)
        c.setDash(3, 4)
        c.line(x, 382, x, 105)
        c.setDash()
    events = [
        (350, 145, 390, "1  Select summary + CareTeam", ACCENT),
        (315, 390, 637, "2  Grant confirmed members access", SECONDARY),
        (280, 637, 145, "3  CareTeam can view", GREEN),
        (220, 145, 390, "4  Patient revokes", ACCENT),
        (185, 390, 637, "5  Relay removes access", SECONDARY),
        (150, 637, 145, "6  Summary disappears", GREEN),
    ]
    for y, start_x, end_x, label, color in events:
        direction = 1 if end_x > start_x else -1
        arrow(c, start_x + 10 * direction, y, end_x - 10 * direction, y, label, color=color)
    rounded_panel(c, 38, 49, 716, 47, fill=PALE_GREEN, stroke=GREEN)
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(GREEN)
    c.drawString(55, 69, "Control rule")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(INK)
    c.drawString(125, 69, "No blanket access. No automatic resharing. No penalty for sharing nothing.")
    c.showPage()

    # 5 — Account deletion
    page_base(c, 5, "Account deletion")
    title(c, "Account deletion", "Delete the account; preserve accountable evidence", "The flow separates user data removal from the minimum records Bast needs to prove what happened.")
    step(c, 1, 38, 335, 220, "Confirm in BastCare", "The user reviews the effects and confirms account deletion.", fill=PALE_BLUE)
    step(c, 2, 286, 335, 220, "Remove active account data", "Identity links, access, shared summaries, invitations, device registrations, and local app data are removed.", fill=PALE_GREEN)
    step(c, 3, 534, 335, 220, "Confirm the outcome", "BastCare reports success or a clear retry path; the action receives an audit reference.", fill=PALE_VIOLET)
    arrow(c, 258, 372, 286, 372)
    arrow(c, 506, 372, 534, 372)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(INK)
    c.drawString(38, 287, "After deletion")
    card(c, 38, 115, 342, 145, "Deleted", "User-facing account data", "Account identity links, authentication access, CareTeam membership, invitations, shared content, device registrations, and local BastCare data.", fill=PALE_GREEN, accent=GREEN)
    card(c, 412, 115, 342, 145, "Retained — limited", "Audit and usage evidence", "Deletion event, outcome, timing, and minimized usage or token totals needed for security, billing transparency, legal duties, and aggregate operations. No audio or transcript text.", fill=WARM, accent=ORANGE)
    rounded_panel(c, 38, 52, 716, 43, fill=INK, stroke=INK)
    c.setFont("Helvetica-Bold", 9.2)
    c.setFillColor(white)
    c.drawCentredString(PAGE_W / 2, 69, "Retention is purpose-limited, access-controlled, and governed by Bast's documented retention schedule.")
    c.showPage()

    # 6 — Commitments and responsibilities
    page_base(c, 6, "Design commitments")
    title(c, "Design commitments", "What the architecture is designed to protect", "A release-ready summary for users, reviewers, partners, and future contributors.")
    commitments = [
        ("Consent", "Recording begins only after permission from everyone present."),
        ("Provenance", "The summary identifies what came from the visit and what the patient added."),
        ("Data minimization", "Bast stores no audio or transcript archive; durable data serves a stated purpose."),
        ("Patient control", "Each CareTeam share is explicit, scoped, visible, and revocable."),
        ("Account deletion", "The app offers deletion without requiring support intervention."),
        ("Accountability", "Limited audit evidence records actions without retaining transcript content."),
    ]
    positions = [(38, 335), (286, 335), (534, 335), (38, 220), (286, 220), (534, 220)]
    fills = [PALE_GREEN, PALE_BLUE, PALE_BLUE, PALE_VIOLET, PALE_GREEN, WARM]
    accents = [GREEN, ACCENT, ACCENT, SECONDARY, GREEN, ORANGE]
    for i, ((heading, body), (x, y)) in enumerate(zip(commitments, positions), start=1):
        card(c, x, y, 220, 92, f"C{i}", heading, body, fill=fills[i - 1], accent=accents[i - 1])
    rounded_panel(c, 38, 58, 716, 119, fill=INK, stroke=INK)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(white)
    c.drawString(56, 145, "Plain-language architecture")
    text_block(c, "BastCare records only with permission. Audio stays on the iPhone. Masked text is sent securely to create a summary; Bast does not save or log transcript text. The patient reviews the summary and decides who may see it. Access can be removed. Deleting an account removes active identity and sharing data while Bast keeps only limited evidence needed for accountability.", 56, 123, 675, 10.2, 14, color=white)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
