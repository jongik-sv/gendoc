# PPTX 병합 가이드

PowerPoint 파일을 슬라이드 마스터를 유지하면서 병합하고, LLM이 사용할 수 있는 템플릿으로 변환하는 가이드입니다.

## 목차

1. [사전 준비](#1-사전-준비)
2. [슬라이드 마스터 분석](#2-슬라이드-마스터-분석)
3. [슬라이드 병합](#3-슬라이드-병합)
4. [LLM 템플릿 변환](#4-llm-템플릿-변환)
5. [전체 통합 스크립트](#5-전체-통합-스크립트)

---

## 1. 사전 준비

### 필요 라이브러리 설치

```bash
pip install python-pptx lxml
```

### 기본 import

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from copy import deepcopy
from lxml import etree
import zipfile
import re
```

---

## 2. 슬라이드 마스터 분석

### 2.1 기본 정보 확인

```python
def analyze_presentation(pptx_file):
    """프레젠테이션 기본 정보 분석"""
    prs = Presentation(pptx_file)

    print(f"파일: {pptx_file}")
    print(f"슬라이드 크기: {prs.slide_width.inches:.2f}\" x {prs.slide_height.inches:.2f}\"")
    print(f"슬라이드 수: {len(prs.slides)}")
    print(f"슬라이드 마스터 수: {len(prs.slide_masters)}")

    return prs
```

### 2.2 슬라이드 레이아웃 목록 확인

```python
def list_layouts(prs):
    """모든 슬라이드 레이아웃 목록 출력"""
    for master in prs.slide_masters:
        print(f"\n슬라이드 레이아웃 ({len(master.slide_layouts)}개):")
        for idx, layout in enumerate(master.slide_layouts):
            placeholder_count = len(list(layout.placeholders))
            print(f"  [{idx}] '{layout.name}' (placeholder: {placeholder_count}개)")
```

### 2.3 특정 레이아웃의 Placeholder 상세 분석

```python
def analyze_layout(prs, layout_index):
    """특정 레이아웃의 placeholder 상세 분석"""
    layout = prs.slide_layouts[layout_index]

    print(f"레이아웃: '{layout.name}'")
    print("-" * 50)

    # 위치(top) 기준 정렬
    placeholders = []
    for ph in layout.placeholders:
        placeholders.append({
            'idx': ph.placeholder_format.idx,
            'type': str(ph.placeholder_format.type).replace("PLACEHOLDER_", ""),
            'top': ph.top.inches,
            'left': ph.left.inches,
            'width': ph.width.inches,
            'height': ph.height.inches,
            'text': ph.text_frame.text[:30] if hasattr(ph, 'text_frame') and ph.text_frame.text else ""
        })

    placeholders.sort(key=lambda x: x['top'])

    for ph in placeholders:
        print(f"[{ph['idx']:2d}] {ph['type']:15s}")
        print(f"     위치: Y={ph['top']:.2f}\", X={ph['left']:.2f}\"")
        print(f"     크기: {ph['width']:.2f}\" x {ph['height']:.2f}\"")
        if ph['text']:
            print(f"     기본텍스트: '{ph['text']}'")
        print()
```

### 2.4 테마 색상/폰트 분석

```python
def analyze_theme(pptx_file):
    """테마 색상 및 폰트 스키마 분석"""
    with zipfile.ZipFile(pptx_file, 'r') as z:
        theme_files = [f for f in z.namelist() if 'theme1.xml' in f]

        for theme_file in theme_files:
            theme_xml = z.read(theme_file)
            root = etree.fromstring(theme_xml)

            nsmap = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}

            # 색상 스키마
            clrScheme = root.find('.//a:clrScheme', nsmap)
            if clrScheme is not None:
                print(f"색상 스키마: {clrScheme.get('name', 'Unknown')}")

                color_names = {
                    'dk1': '어두운색1 (텍스트)', 'lt1': '밝은색1 (배경)',
                    'dk2': '어두운색2', 'lt2': '밝은색2',
                    'accent1': '강조색1', 'accent2': '강조색2',
                    'accent3': '강조색3', 'accent4': '강조색4',
                    'accent5': '강조색5', 'accent6': '강조색6',
                }

                for elem in clrScheme:
                    tag = elem.tag.split('}')[-1]
                    if tag in color_names:
                        srgb = elem.find('.//a:srgbClr', nsmap)
                        if srgb is not None:
                            print(f"  {color_names[tag]}: #{srgb.get('val')}")

            # 폰트 스키마
            fontScheme = root.find('.//a:fontScheme', nsmap)
            if fontScheme is not None:
                print(f"\n폰트 스키마: {fontScheme.get('name', 'Unknown')}")

                for font_type, label in [('majorFont', '제목'), ('minorFont', '본문')]:
                    font = fontScheme.find(f'.//a:{font_type}', nsmap)
                    if font is not None:
                        latin = font.find('a:latin', nsmap)
                        ea = font.find('a:ea', nsmap)
                        print(f"  {label}: {latin.get('typeface') if latin is not None else 'N/A'}")
                        if ea is not None and ea.get('typeface'):
                            print(f"       (동아시아: {ea.get('typeface')})")
```

---

## 3. 슬라이드 병합

### 3.1 기본 병합 (레이아웃 지정)

```python
def merge_slides(base_pptx, source_pptx, output_pptx, layout_index=None):
    """
    슬라이드 병합

    Args:
        base_pptx: 기본 양식 파일 (슬라이드 마스터 유지)
        source_pptx: 추가할 슬라이드가 있는 파일
        output_pptx: 출력 파일명
        layout_index: 사용할 레이아웃 인덱스 (None이면 빈 레이아웃 사용)
    """
    prs_base = Presentation(base_pptx)
    prs_source = Presentation(source_pptx)

    # 레이아웃 선택
    if layout_index is not None:
        target_layout = prs_base.slide_layouts[layout_index]
    else:
        # 빈 레이아웃 찾기 (보통 인덱스 6)
        try:
            target_layout = prs_base.slide_layouts[6]
        except:
            target_layout = prs_base.slide_layouts[-1]

    print(f"사용 레이아웃: '{target_layout.name}'")

    # 슬라이드 복사
    for idx, slide in enumerate(prs_source.slides):
        new_slide = prs_base.slides.add_slide(target_layout)

        # 레이아웃의 기본 placeholder 제거
        for shape in list(new_slide.shapes):
            if shape.is_placeholder:
                shape._element.getparent().remove(shape._element)

        # 원본 슬라이드의 shape 복사
        for shape in slide.shapes:
            new_el = deepcopy(shape.element)
            new_slide.shapes._spTree.insert_element_before(new_el, 'p:extLst')

        print(f"슬라이드 {idx + 1} 복사 완료")

    prs_base.save(output_pptx)
    print(f"\n완료: {output_pptx} (총 {len(prs_base.slides)}개 슬라이드)")

    return prs_base
```

### 3.2 Placeholder에 내용 설정하며 병합

```python
def merge_with_placeholders(base_pptx, source_pptx, output_pptx, layout_index, placeholder_content):
    """
    Placeholder에 내용을 설정하면서 병합

    Args:
        placeholder_content: dict - {placeholder_idx: "내용"} 형태
            예: {0: "제목", 18: "Action Title 내용", 19: "카테고리"}
    """
    prs_base = Presentation(base_pptx)
    prs_source = Presentation(source_pptx)
    target_layout = prs_base.slide_layouts[layout_index]

    for idx, slide in enumerate(prs_source.slides):
        new_slide = prs_base.slides.add_slide(target_layout)

        # Placeholder에 내용 설정
        for shape in new_slide.shapes:
            if shape.is_placeholder:
                ph_idx = shape.placeholder_format.idx
                if ph_idx in placeholder_content:
                    # 함수인 경우 슬라이드 인덱스 전달
                    content = placeholder_content[ph_idx]
                    if callable(content):
                        shape.text = content(idx)
                    else:
                        shape.text = content
                else:
                    # 사용하지 않는 placeholder 제거
                    shape._element.getparent().remove(shape._element)

        # 원본 shape 복사
        for shape in slide.shapes:
            if shape.is_placeholder:
                ph_type = str(shape.placeholder_format.type)
                # 특정 placeholder 제외
                if any(x in ph_type for x in ["SLIDE_NUMBER", "FOOTER", "OBJECT"]):
                    continue

            new_el = deepcopy(shape.element)
            new_slide.shapes._spTree.insert_element_before(new_el, 'p:extLst')

    prs_base.save(output_pptx)
    return prs_base
```

---

## 4. LLM 템플릿 변환

### 4.1 템플릿 변환 규칙 정의

```python
# 제거할 placeholder 텍스트 패턴
REMOVE_PATTERNS = [
    r'우리는 인간생활의 향상과 개선에 필요한[^\n]*',
    r'우리는 제품과 서비스를 생산하기 이전에[^\n]*',
    r'이를 위하여 모든 사람은[^\n]*',
    r'이 목적을 달성하기 위하여[^\n]*',
    r'또한 인재를 양성하고[^\n]*',
    r'우리의 제품과 서비스는[^\n]*',
    r'나아가 문화의 발전에 기여한다[^\n]*',
    r'따라서 기업의 이익은[^\n]*',
    # 필요시 패턴 추가
]

# 스타일 가이드 -> 템플릿 변환
TEMPLATE_REPLACEMENTS = [
    (r'소제목/?[ ]*Medium[ ]*14pt', '{{소제목}}'),
    (r'중제목[/|]?[ ]*Medium[ ,]*16pt', '{{중제목}}'),
    (r'텍스트를 입력하세요\s*', '{{텍스트}}'),
    (r'텍스트를 입력하시오', '{{텍스트}}'),
    # 필요시 패턴 추가
]
```

### 4.2 텍스트 변환 함수

```python
def convert_to_template(text):
    """텍스트를 LLM 템플릿 형식으로 변환"""
    result = text

    # 1. placeholder 문장 제거
    for pattern in REMOVE_PATTERNS:
        result = re.sub(pattern, '', result, flags=re.IGNORECASE)

    # 2. 스타일 가이드 -> 템플릿
    for pattern, replacement in TEMPLATE_REPLACEMENTS:
        result = re.sub(pattern, replacement, result)

    # 3. 소제목 뒤에 본문 템플릿 추가
    if '{{소제목}}' in result and '{{본문_내용}}' not in result:
        result = result.replace('{{소제목}}', '{{소제목}}\n{{본문_내용}}')

    # 4. 정리
    result = re.sub(r'[\s\|\.]+$', '', result)
    result = re.sub(r'^[\s\|\.]+', '', result)
    result = re.sub(r'\n\s*\n+', '\n', result)

    return result.strip()
```

### 4.3 프레젠테이션에 템플릿 적용

```python
def apply_templates_to_presentation(prs):
    """프레젠테이션의 모든 텍스트를 템플릿으로 변환"""
    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, 'text_frame'):
                for para in shape.text_frame.paragraphs:
                    full_text = ''.join(run.text for run in para.runs)
                    converted = convert_to_template(full_text)

                    if full_text != converted and para.runs:
                        para.runs[0].text = converted
                        for run in para.runs[1:]:
                            run.text = ''

    return prs
```

---

## 5. 전체 통합 스크립트

```python
#!/usr/bin/env python3
"""
PPTX 병합 및 LLM 템플릿 변환 스크립트

사용법:
    python pptx_merge.py --base 기본양식.pptx --source 템플릿.pptx --output 결과.pptx --layout 8
"""

from pptx import Presentation
from copy import deepcopy
import re
import argparse

# ============================================================
# 설정
# ============================================================

REMOVE_PATTERNS = [
    r'우리는 인간생활의 향상과 개선에 필요한[^\n]*',
    r'우리는 제품과 서비스를 생산하기 이전에[^\n]*',
    r'이를 위하여 모든 사람은[^\n]*',
    r'이 목적을 달성하기 위하여[^\n]*',
    r'또한 인재를 양성하고[^\n]*',
    r'우리의 제품과 서비스는[^\n]*',
    r'나아가 문화의 발전에 기여한다[^\n]*',
    r'따라서 기업의 이익은[^\n]*',
]

TEMPLATE_REPLACEMENTS = [
    (r'소제목/?[ ]*Medium[ ]*14pt', '{{소제목}}'),
    (r'중제목[/|]?[ ]*Medium[ ,]*16pt', '{{중제목}}'),
    (r'텍스트를 입력하세요\s*', '{{텍스트}}'),
    (r'텍스트를 입력하시오', '{{텍스트}}'),
]

# ============================================================
# 함수
# ============================================================

def convert_to_template(text):
    """텍스트를 LLM 템플릿으로 변환"""
    result = text

    for pattern in REMOVE_PATTERNS:
        result = re.sub(pattern, '', result, flags=re.IGNORECASE)

    for pattern, replacement in TEMPLATE_REPLACEMENTS:
        result = re.sub(pattern, replacement, result)

    if '{{소제목}}' in result and '{{본문_내용}}' not in result:
        result = result.replace('{{소제목}}', '{{소제목}}\n{{본문_내용}}')

    result = re.sub(r'[\s\|\.]+$', '', result)
    result = re.sub(r'^[\s\|\.]+', '', result)
    result = re.sub(r'\n\s*\n+', '\n', result)

    return result.strip()


def merge_pptx(base_pptx, source_pptx, output_pptx, layout_index=None, apply_template=True):
    """
    PPTX 파일 병합

    Args:
        base_pptx: 기본 양식 (슬라이드 마스터 유지)
        source_pptx: 추가할 슬라이드
        output_pptx: 출력 파일
        layout_index: 레이아웃 인덱스 (None이면 빈 레이아웃)
        apply_template: LLM 템플릿 변환 적용 여부
    """
    prs_base = Presentation(base_pptx)
    prs_source = Presentation(source_pptx)

    # 레이아웃 선택
    if layout_index is not None:
        target_layout = prs_base.slide_layouts[layout_index]
    else:
        target_layout = prs_base.slide_layouts[-1]

    print(f"기본 양식: {len(prs_base.slides)}개 슬라이드")
    print(f"추가 대상: {len(prs_source.slides)}개 슬라이드")
    print(f"레이아웃: '{target_layout.name}'")
    print()

    # 슬라이드 복사
    for idx, slide in enumerate(prs_source.slides):
        new_slide = prs_base.slides.add_slide(target_layout)

        # placeholder 제거
        for shape in list(new_slide.shapes):
            if shape.is_placeholder:
                shape._element.getparent().remove(shape._element)

        # shape 복사
        for shape in slide.shapes:
            new_el = deepcopy(shape.element)
            new_slide.shapes._spTree.insert_element_before(new_el, 'p:extLst')

        # 템플릿 변환
        if apply_template:
            for shape in new_slide.shapes:
                if hasattr(shape, 'text_frame'):
                    for para in shape.text_frame.paragraphs:
                        full_text = ''.join(run.text for run in para.runs)
                        converted = convert_to_template(full_text)
                        if full_text != converted and para.runs:
                            para.runs[0].text = converted
                            for run in para.runs[1:]:
                                run.text = ''

        # 사용된 템플릿 확인
        templates = set(re.findall(r'\{\{[^}]+\}\}',
                        ' '.join(s.text for s in new_slide.shapes if hasattr(s, 'text'))))
        template_str = ', '.join(sorted(templates)) if templates else '-'
        print(f"슬라이드 {idx + 1}: {template_str}")

    prs_base.save(output_pptx)
    print(f"\n✓ 완료: {output_pptx} (총 {len(prs_base.slides)}개 슬라이드)")

    return prs_base


def analyze_pptx(pptx_file):
    """PPTX 파일 분석"""
    prs = Presentation(pptx_file)

    print(f"파일: {pptx_file}")
    print(f"슬라이드 크기: {prs.slide_width.inches:.2f}\" x {prs.slide_height.inches:.2f}\"")
    print(f"슬라이드 수: {len(prs.slides)}")
    print()

    for master in prs.slide_masters:
        print(f"슬라이드 레이아웃 ({len(master.slide_layouts)}개):")
        for idx, layout in enumerate(master.slide_layouts):
            ph_count = len(list(layout.placeholders))
            print(f"  [{idx}] '{layout.name}' (placeholder: {ph_count}개)")

    return prs


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='PPTX 병합 및 템플릿 변환')
    parser.add_argument('--base', required=True, help='기본 양식 파일')
    parser.add_argument('--source', required=True, help='추가할 슬라이드 파일')
    parser.add_argument('--output', required=True, help='출력 파일')
    parser.add_argument('--layout', type=int, default=None, help='레이아웃 인덱스')
    parser.add_argument('--no-template', action='store_true', help='템플릿 변환 비활성화')
    parser.add_argument('--analyze', action='store_true', help='파일 분석만 수행')

    args = parser.parse_args()

    if args.analyze:
        analyze_pptx(args.base)
    else:
        merge_pptx(
            args.base,
            args.source,
            args.output,
            args.layout,
            not args.no_template
        )
```

---

## 사용 예시

### 분석

```bash
python pptx_merge.py --base PPT기본양식.pptx --source dummy --output dummy --analyze
```

### 병합 (템플릿 변환 포함)

```bash
python pptx_merge.py \
    --base PPT기본양식.pptx \
    --source PPT템플릿_예시.pptx \
    --output PPT기본양식_병합.pptx \
    --layout 8
```

### 병합 (템플릿 변환 없이)

```bash
python pptx_merge.py \
    --base PPT기본양식.pptx \
    --source PPT템플릿_예시.pptx \
    --output PPT기본양식_병합.pptx \
    --layout 8 \
    --no-template
```

---

## LLM 템플릿 형식

| 템플릿 | 용도 | 예시 |
|--------|------|------|
| `{{중제목}}` | 섹션 제목 (16pt) | "프로젝트 개요" |
| `{{소제목}}` | 항목 제목 (14pt) | "1분기 실적" |
| `{{본문_내용}}` | 상세 설명 | "매출 20% 증가" |
| `{{텍스트}}` | 일반 텍스트 | "담당자: 홍길동" |

---

## 주의사항

1. **슬라이드 마스터**: 기본 양식(`base_pptx`)의 슬라이드 마스터가 유지됩니다.
2. **레이아웃 선택**: 분석 후 적절한 레이아웃 인덱스를 지정하세요.
3. **템플릿 패턴**: 실제 문서의 placeholder 텍스트에 맞게 패턴을 수정하세요.
4. **이미지/차트**: shape 복사 시 이미지와 차트도 함께 복사됩니다.
