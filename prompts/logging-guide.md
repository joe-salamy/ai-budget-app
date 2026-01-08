# Logging Implementation Guide

## Overview

This guide documents a consistent, professional logging pattern for Python projects. It provides centralized configuration, clear visual hierarchy, and proper handling of parallel processing scenarios.

## File Structure

```
project_root/
├── logs/                    # Auto-created log directory
│   └── app_name_YYYYMMDD_HHMMSS.log
├── src/
│   ├── logger_config.py     # Centralized logging configuration
│   └── your_modules.py      # Modules that use logging
```

## Core Implementation

### 1. Logger Configuration Module

Create a dedicated logger_config.py file:

```python
"""
Centralized logging configuration.
Creates timestamped log files and provides formatted console output.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime


def setup_logging(log_dir: Path = None) -> logging.Logger:
    """
    Setup logging configuration with file and console handlers.

    Args:
        log_dir: Directory for log files (default: project_root/logs)

    Returns:
        Configured root logger instance
    """
    # Set up log directory
    if log_dir is None:
        project_root = Path(__file__).parent.parent
        log_dir = project_root / "logs"

    log_dir.mkdir(parents=True, exist_ok=True)

    # Create timestamped log file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"app_name_{timestamp}.log"

    # Create root logger for the application
    logger = logging.getLogger("app_name")
    logger.setLevel(logging.DEBUG)

    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()

    # File handler - detailed logging
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_formatter)

    # Console handler - user-friendly output
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter("%(message)s")
    console_handler.setFormatter(console_formatter)

    # Add handlers
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    # Log initialization
    logger.info("=" * 70)
    logger.info(f"Logging initialized - Log file: {log_file}")
    logger.info("=" * 70)

    return logger


def get_logger(name: str = None) -> logging.Logger:
    """
    Get a logger instance for a specific module.

    Args:
        name: Name of the module (typically __name__)

    Returns:
        Logger instance
    """
    if name:
        return logging.getLogger(f"app_name.{name}")
    return logging.getLogger("app_name")
```

### 2. Using the Logger in Modules

```python
"""
Example module demonstrating proper logging usage.
"""

from logger_config import get_logger

# Initialize logger at module level
logger = get_logger(__name__)


def process_data(data):
    """Example function with proper logging."""
    logger.debug(f"Starting data processing with {len(data)} items")

    # Processing logic here
    result = transform(data)

    logger.debug(f"Processing completed: {len(result)} items produced")
    return result
```

### 3. Main Entry Point

```python
"""
Main entry point - initializes logging before any other imports.
"""

from pathlib import Path
from logger_config import setup_logging, get_logger

# Initialize logging FIRST
setup_logging()
logger = get_logger(__name__)


def main():
    logger.info("=" * 70)
    logger.info("APPLICATION STARTED")
    logger.info("=" * 70)

    # Your application logic here

    logger.info("=" * 70)
    logger.info("APPLICATION COMPLETED")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
```

## Visual Hierarchy Guidelines

### Major Steps (Double Line)

Use `"=" * 70` for major application phases:

```python
logger.info("=" * 70)
logger.info("PHASE 1: DATA INGESTION")
logger.info("=" * 70)

# ... phase logic ...

logger.info("=" * 70)
logger.info("PHASE 1 COMPLETE")
logger.info("=" * 70)
```

### Minor Steps (Single Line)

Use `"─" * 70` for sub-steps within a phase:

```python
logger.info("─" * 70)
logger.info("Step 1.1: Loading configuration")
logger.info("─" * 70)

# ... step logic ...

logger.info("─" * 70)
logger.info("Step 1.1 complete")
logger.info("─" * 70)
```

### Example Output

```
======================================================================
PHASE 1: AUDIO PROCESSING
======================================================================
──────────────────────────────────────────────────────────────────────
Step 1.1: Converting audio format
──────────────────────────────────────────────────────────────────────
[DEBUG] Loading audio file: lecture_01.m4a
[DEBUG] Converting M4A to WAV at 16kHz
[DEBUG] Conversion complete: 245760 samples
──────────────────────────────────────────────────────────────────────
Step 1.1 complete
──────────────────────────────────────────────────────────────────────
======================================================================
PHASE 1 COMPLETE
======================================================================
```

## Logging Level Guidelines

| Level      | Use Case                         | Example                                                  |
| ---------- | -------------------------------- | -------------------------------------------------------- |
| `DEBUG`    | Detailed diagnostic info         | `logger.debug(f"Loaded {len(items)} items from cache")`  |
| `INFO`     | Progress updates for users       | `logger.info("Processing file 3 of 10...")`              |
| `WARNING`  | Recoverable issues               | `logger.warning(f"Cache miss, fetching from API")`       |
| `ERROR`    | Errors that don't stop execution | `logger.error(f"Failed to process item {id}, skipping")` |
| `CRITICAL` | Fatal errors                     | `logger.critical("Database connection failed, exiting")` |

## Parallel Processing Configuration

### Using multiprocessing (CPU-bound)

```python
"""
Parallel processing with centralized logging.
"""

import multiprocessing
from multiprocessing import Queue
import logging
from logger_config import get_logger

logger = get_logger(__name__)


def worker_init(log_queue: Queue):
    """
    Initialize logging in worker process to send logs to main process.
    """
    queue_handler = logging.handlers.QueueHandler(log_queue)
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(queue_handler)
    root_logger.setLevel(logging.DEBUG)


def worker_task(item, log_queue: Queue):
    """
    Worker function that logs to the shared queue.
    """
    worker_init(log_queue)
    worker_logger = logging.getLogger(f"app_name.worker.{multiprocessing.current_process().name}")

    worker_logger.debug(f"Processing item: {item}")
    # ... processing logic ...
    worker_logger.debug(f"Completed item: {item}")

    return result


def log_listener(log_queue: Queue, main_logger: logging.Logger):
    """
    Listener that receives logs from workers and writes to main logger.
    """
    while True:
        try:
            record = log_queue.get()
            if record is None:  # Shutdown signal
                break
            main_logger.handle(record)
        except Exception:
            pass


def run_parallel_processing(items: list):
    """
    Run parallel processing with centralized logging.
    """
    log_queue = multiprocessing.Manager().Queue()

    # Start log listener thread
    import threading
    listener = threading.Thread(
        target=log_listener,
        args=(log_queue, logging.getLogger("app_name"))
    )
    listener.start()

    logger.info("─" * 70)
    logger.info(f"Starting parallel processing with {len(items)} items")
    logger.info("─" * 70)

    with multiprocessing.Pool() as pool:
        results = pool.starmap(
            worker_task,
            [(item, log_queue) for item in items]
        )

    # Shutdown listener
    log_queue.put(None)
    listener.join()

    logger.info("─" * 70)
    logger.info("Parallel processing complete")
    logger.info("─" * 70)

    return results
```

### Using concurrent.futures (Thread-based)

```python
"""
Thread-based parallel processing - logging works automatically.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from logger_config import get_logger

logger = get_logger(__name__)


def process_item(item):
    """Worker function - uses module logger directly."""
    logger.debug(f"[Thread] Processing: {item}")
    # ... processing logic ...
    logger.debug(f"[Thread] Completed: {item}")
    return result


def run_threaded_processing(items: list, max_workers: int = 4):
    """Run threaded processing."""
    logger.info("─" * 70)
    logger.info(f"Starting threaded processing: {len(items)} items, {max_workers} workers")
    logger.info("─" * 70)

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_item, item): item for item in items}

        for future in as_completed(futures):
            item = futures[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                logger.error(f"Failed to process {item}: {e}")

    logger.info("─" * 70)
    logger.info(f"Threaded processing complete: {len(results)} succeeded")
    logger.info("─" * 70)

    return results
```

## Best Practices Checklist

### Do's

- ✅ Initialize logging once at application startup
- ✅ Use `get_logger(__name__)` at module level
- ✅ Use DEBUG for diagnostic details, INFO for user-facing progress
- ✅ Include relevant context in log messages (counts, identifiers, durations)
- ✅ Use visual separators (`=` and `─`) for phase/step boundaries
- ✅ Log both start and completion of significant operations
- ✅ Handle exceptions and log them before re-raising
- ✅ Replace existing `print()` statements with logging

### Don'ts

- ❌ Never use `print()` statements - always use logging
- ❌ Don't use `\n` for visual separation - use separator lines instead
- ❌ Don't repeat the same information in consecutive log calls
- ❌ Don't log sensitive information (passwords, API keys, PII)
- ❌ Don't create new logger instances inside loops
- ❌ Don't call `setup_logging()` multiple times

## Example: Complete Function with Proper Logging

```python
def preprocess_audio(audio_file: Path) -> Tuple[np.ndarray, int]:
    """Example function demonstrating comprehensive logging."""
    logger.debug(f"Starting audio preprocessing for: {audio_file.name}")

    try:
        # Step 1
        logger.debug(f"[M4A→WAV] Converting {audio_file.name}")
        audio = AudioSegment.from_file(str(audio_file), format="m4a")
        logger.debug(f"[M4A→WAV DONE] Converted to WAV")

        # Step 2
        logger.debug(f"[LOAD AUDIO] Loading converted audio at 16kHz mono")
        samples, sample_rate = librosa.load(temp_wav_path, sr=16000, mono=True)
        logger.debug(f"[LOAD AUDIO DONE] {len(samples)} samples at {sample_rate}Hz")

        # Step 3
        logger.debug("Applying noise reduction")
        samples = nr.reduce_noise(y=samples, sr=sample_rate)
        logger.debug("Noise reduction completed")

        # Step 4
        logger.debug("Normalizing audio levels to -12dB")
        max_amplitude = np.abs(samples).max()
        if max_amplitude > 0:
            samples = samples * (target_amplitude / max_amplitude)
            logger.debug(f"Audio normalized: {max_amplitude:.4f} -> {target_amplitude:.4f}")
        else:
            logger.warning(f"Audio file has zero amplitude: {audio_file.name}")

        logger.debug(f"Audio preprocessing completed for: {audio_file.name}")
        return samples, sample_rate

    except Exception as e:
        logger.error(f"Failed to preprocess {audio_file.name}: {e}")
        raise
```

## Log File Format Reference

File logs include full diagnostic information:

```
2026-01-01 10:30:45 | DEBUG    | app_name.audio_helper | preprocess_audio:42 | Starting audio preprocessing for: lecture_01.m4a
2026-01-01 10:30:45 | DEBUG    | app_name.audio_helper | preprocess_audio:47 | [M4A→WAV] Converting lecture_01.m4a
2026-01-01 10:30:46 | DEBUG    | app_name.audio_helper | preprocess_audio:50 | [M4A→WAV DONE] Converted to WAV
```

Console output is user-friendly:

```
Starting audio preprocessing for: lecture_01.m4a
Audio preprocessing completed for: lecture_01.m4a
```
