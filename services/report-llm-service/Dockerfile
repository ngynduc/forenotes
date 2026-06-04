FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home --shell /usr/sbin/nologin forenotes

COPY app.py .

ENV HOST=0.0.0.0
ENV PORT=8001

EXPOSE 8001
USER forenotes
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/health', timeout=3)" || exit 1

CMD ["sh", "-c", "uvicorn app:app --host ${HOST} --port ${PORT}"]
